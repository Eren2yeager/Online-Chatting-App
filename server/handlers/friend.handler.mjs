import User from "../../src/models/User.mjs";
import FriendRequest from "../../src/models/FriendRequest.mjs";
import Notification from "../../src/models/Notification.mjs";
import { createAndEmitNotification } from "./notification.handler.mjs";

/**
 * Register friend-related event handlers
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {Map} userSockets - Map of userId to socketId
 */
export function registerFriendHandlers(socket, io, userSockets) {
  /**
   * Create a new friend request
   */
  socket.on("friend:request:create", async (data, ack) => {
    try {
      const { handle, message } = data || {};

      if (!handle) {
        return ack?.({ success: false, error: "Handle is required" });
      }

      // Find target user by handle
      const normalizedHandle = handle.replace("@", "");
      const targetUser = await User.findOne({ handle: normalizedHandle });

      if (!targetUser) {
        return ack?.({ success: false, error: "User not found" });
      }

      if (targetUser._id.toString() === socket.userId) {
        return ack?.({ success: false, error: "Cannot send request to yourself" });
      }

      // Get current user for validation
      const currentUser = await User.findById(socket.userId);

      // Check blocking status
      if ((targetUser.blocked || []).map(String).includes(socket.userId)) {
        return ack?.({ success: false, error: "You are blocked by this user" });
      }

      if ((currentUser.blocked || []).map(String).includes(targetUser._id.toString())) {
        return ack?.({ success: false, error: "Cannot send request to blocked user" });
      }

      // Check if already friends
      if ((currentUser.friends || []).map(String).includes(targetUser._id.toString())) {
        return ack?.({ success: false, error: "Already friends" });
      }

      // Check for existing pending request
      const existingPending = await FriendRequest.findOne({
        $or: [
          { from: socket.userId, to: targetUser._id, status: "pending" },
          { from: targetUser._id, to: socket.userId, status: "pending" },
        ],
      });

      if (existingPending) {
        return ack?.({ success: false, error: "Friend request already exists" });
      }

      // Create friend request
      const friendRequest = await FriendRequest.create({
        from: socket.userId,
        to: targetUser._id,
        message: message || "",
        status: "pending",
      });

      // Populate request with user details
      const populated = await FriendRequest.findById(friendRequest._id)
        .populate("from", "name handle image status lastSeen")
        .populate("to", "name handle image status lastSeen");

      // Create and emit notification for target user
      await createAndEmitNotification(io, userSockets, {
        to: targetUser._id,
        type: "friend_request",
        title: socket.user.name,
        body: message || "Sent you a friend request",
        data: { requestId: friendRequest._id, from: socket.userId },
        fromUser: socket.userId,
      });

      // Emit to target user if online
      const targetSocketId = userSockets.get(targetUser._id.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:request:new", { request: populated });
      }

      ack?.({ success: true, request: populated });
    } catch (error) {
      console.error("friend:request:create error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Handle friend request action (accept, reject, cancel)
   */
  socket.on("friend:request:action", async (data, ack) => {
    try {
      const { requestId, action } = data || {};

      if (!requestId || !["accept", "reject", "cancel"].includes(action)) {
        return ack?.({ success: false, error: "Invalid input" });
      }

      const reqDoc = await FriendRequest.findById(requestId);
      if (!reqDoc) {
        return ack?.({ success: false, error: "Request not found" });
      }

      // Verify permissions
      if (action === "cancel" && reqDoc.from.toString() !== socket.userId) {
        return ack?.({ success: false, error: "Cannot cancel someone else's request" });
      }

      if (["accept", "reject"].includes(action) && reqDoc.to.toString() !== socket.userId) {
        return ack?.({ success: false, error: "Cannot accept/reject request not addressed to you" });
      }

      const fromId = reqDoc.from.toString();
      const toId = reqDoc.to.toString();

      // Handle accept action
      if (action === "accept") {
        const [fromUser, toUser] = await Promise.all([
          User.findById(fromId),
          User.findById(toId),
        ]);

        if (fromUser && toUser) {
          // Add to friends lists
          if (!fromUser.friends.map(String).includes(toId)) {
            fromUser.friends.push(toId);
          }
          if (!toUser.friends.map(String).includes(fromId)) {
            toUser.friends.push(fromId);
          }
          await Promise.all([fromUser.save(), toUser.save()]);
        }

        // Delete the request
        await FriendRequest.findByIdAndDelete(requestId);

        // Notify both users
        const payload = { requestId, from: fromId, to: toId };
        
        // Use user rooms for more reliable delivery
        io.to(`user:${fromId}`).emit("friend:request:accepted", payload);
        io.to(`user:${toId}`).emit("friend:request:accepted", payload);

        // Create and emit notification for requester
        await createAndEmitNotification(io, userSockets, {
          to: fromId,
          type: "friend_request_accepted",
          title: "Friend request accepted",
          body: "Your friend request was accepted",
          data: { to: toId },
          fromUser: toId,
        });

        return ack?.({ success: true, message: "accepted" });
      }

      // Handle cancel action
      if (action === "cancel") {
        await FriendRequest.findByIdAndDelete(requestId);

        const payload = { requestId, from: fromId, to: toId };
        
        // Use user rooms for more reliable delivery
        io.to(`user:${fromId}`).emit("friend:request:cancelled", payload);
        io.to(`user:${toId}`).emit("friend:request:cancelled", payload);

        return ack?.({ success: true, message: "cancelled" });
      }

      // Handle reject action
      if (action === "reject") {
        reqDoc.status = "rejected";
        await reqDoc.save();

        const populated = await FriendRequest.findById(requestId)
          .populate("from", "name handle image status lastSeen")
          .populate("to", "name handle image status lastSeen");

        const payload = { request: populated };
        
        // Use user rooms for more reliable delivery
        io.to(`user:${fromId}`).emit("friend:request:rejected", payload);
        io.to(`user:${toId}`).emit("friend:request:rejected", payload);

        return ack?.({ success: true, request: populated });
      }

      ack?.({ success: false, error: "Unhandled action" });
    } catch (error) {
      console.error("friend:request:action error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Remove a friend
   */
  socket.on("friend:remove", async (data, ack) => {
    try {
      const { friendId } = data || {};

      if (!friendId) {
        return ack?.({ success: false, error: "friendId required" });
      }

      const user = await User.findById(socket.userId);
      if (!user) {
        return ack?.({ success: false, error: "User not found" });
      }

      // Remove from current user's friends list
      user.friends = (user.friends || []).filter((id) => id.toString() !== friendId);
      await user.save();

      // Remove from friend's friends list
      const friend = await User.findById(friendId);
      if (friend) {
        friend.friends = (friend.friends || []).filter((id) => id.toString() !== socket.userId);
        await friend.save();
      }

      // Notify friend
      io.to(`user:${friendId}`).emit("friend:removed", { userId: socket.userId });

      ack?.({ success: true });
    } catch (error) {
      console.error("friend:remove error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });
}
