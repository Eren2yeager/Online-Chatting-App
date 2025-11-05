import User from "../../src/models/User.js";
import Chat from "../../src/models/Chat.js";
import FriendRequest from "../../src/models/FriendRequest.js";

/**
 * Register user-related event handlers
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {Map} userSockets - Map of userId to socketId
 */
export function registerUserHandlers(socket, io, userSockets) {
  /**
   * Update user profile
   */
  socket.on("profile:update", async (data, ack) => {
    try {
      const { name, bio, image, handle } = data || {};

      const user = await User.findById(socket.userId);
      if (!user) {
        return ack?.({ success: false, error: "User not found" });
      }

      // Update fields if provided
      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (image) user.image = image;
      
      // Handle unique handle update
      if (handle && handle !== user.handle) {
        const existingUser = await User.findOne({ handle });
        if (existingUser) {
          return ack?.({ success: false, error: "Handle already taken" });
        }
        user.handle = handle;
      }

      await user.save();

      // Broadcast profile update to user's friends
      const friends = user.friends || [];
      for (const friendId of friends) {
        const friendSocketId = userSockets.get(friendId.toString());
        if (friendSocketId) {
          io.to(friendSocketId).emit("profile:updated", {
            userId: socket.userId,
            name: user.name,
            bio: user.bio,
            image: user.image,
            handle: user.handle,
          });
        }
      }

      ack?.({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          image: user.image,
          handle: user.handle,
        },
      });
    } catch (error) {
      console.error("profile:update error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Block a user
   */
  socket.on("user:block", async (data, ack) => {
    try {
      const { userId } = data || {};

      if (!userId) {
        return ack?.({ success: false, error: "userId required" });
      }

      if (userId === socket.userId) {
        return ack?.({ success: false, error: "Cannot block yourself" });
      }

      const user = await User.findById(socket.userId);
      if (!user) {
        return ack?.({ success: false, error: "User not found" });
      }

      // Check if already blocked
      if (user.blocked.map(String).includes(userId)) {
        return ack?.({ success: false, error: "User already blocked" });
      }

      // Add to blocked list
      user.blocked.push(userId);

      // Remove from friends if they are friends
      user.friends = user.friends.filter((id) => id.toString() !== userId);
      await user.save();

      // Remove from blocked user's friends list
      const blockedUser = await User.findById(userId);
      if (blockedUser) {
        blockedUser.friends = blockedUser.friends.filter(
          (id) => id.toString() !== socket.userId
        );
        await blockedUser.save();
      }

      // Delete any pending friend requests between them
      await FriendRequest.deleteMany({
        $or: [
          { from: socket.userId, to: userId },
          { from: userId, to: socket.userId },
        ],
      });

      // Find and leave all direct chats with blocked user
      const directChats = await Chat.find({
        isGroup: false,
        participants: { $all: [socket.userId, userId] },
      });

      for (const chat of directChats) {
        // Emit chat removal to both users
        const userSocketId = userSockets.get(socket.userId);
        const blockedSocketId = userSockets.get(userId);

        if (userSocketId) {
          io.to(userSocketId).emit("chat:removed", { chatId: chat._id });
        }
        if (blockedSocketId) {
          io.to(blockedSocketId).emit("chat:removed", { chatId: chat._id });
        }
      }

      // Notify blocked user if online
      const blockedSocketId = userSockets.get(userId);
      if (blockedSocketId) {
        io.to(blockedSocketId).emit("user:blocked", { userId: socket.userId });
      }

      ack?.({ success: true, blockedUserId: userId });
    } catch (error) {
      console.error("user:block error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Unblock a user
   */
  socket.on("user:unblock", async (data, ack) => {
    try {
      const { userId } = data || {};

      if (!userId) {
        return ack?.({ success: false, error: "userId required" });
      }

      const user = await User.findById(socket.userId);
      if (!user) {
        return ack?.({ success: false, error: "User not found" });
      }

      // Check if user is blocked
      if (!user.blocked.map(String).includes(userId)) {
        return ack?.({ success: false, error: "User is not blocked" });
      }

      // Remove from blocked list
      user.blocked = user.blocked.filter((id) => id.toString() !== userId);
      await user.save();

      // Notify unblocked user if online
      const unblockedSocketId = userSockets.get(userId);
      if (unblockedSocketId) {
        io.to(unblockedSocketId).emit("user:unblocked", { userId: socket.userId });
      }

      ack?.({ success: true, unblockedUserId: userId });
    } catch (error) {
      console.error("user:unblock error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });
}
