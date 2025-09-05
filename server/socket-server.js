"use server";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Import models (ES modules)
import User from "../src/models/User.js";
import Chat from "../src/models/Chat.js";
import Message from "../src/models/Message.js";
import Notification from "../src/models/Notification.js";

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
});

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

let io = null;

// Bootstrap server without top-level await for compatibility
async function start() {
  await app.prepare();

  // Create HTTP server and attach Next handler
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Create Socket.IO server (same HTTP server, same port). No CORS needed when same-origin.
  io = new Server(httpServer, {
    transports: ["websocket", "polling"],
  });

// Store user socket mappings
const userSockets = new Map();
const userRooms = new Map();

/**
 * Authenticate socket connection using JWT token
 */
const authenticateSocket = async (token) => {
  try {
    // Accept direct userId token (from client) as a simple fallback
    if (token && mongoose.isValidObjectId(token)) {
      const user = await User.findById(token);
      if (user) return user;
    }
    // Otherwise try JWT
    if (token) {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      if (decoded?.userId) {
        const user = await User.findById(decoded.userId);
        if (user) return user;
      }
    }
    return null;
  } catch (error) {
    console.error("Socket authentication error:", error);
    return null;
  }
};

/**
 * Join user to their chat rooms
 */
const joinUserToChats = async (socket, userId) => {
  try {
    const chats = await Chat.find({ participants: userId });
    const roomIds = chats.map((chat) => `chat:${chat._id}`);

    // Join all chat rooms
    for (const roomId of roomIds) {
      socket.join(roomId);
    }

    userRooms.set(userId, roomIds);
    console.log(`User ${userId} joined ${roomIds.length} chat rooms`);
  } catch (error) {
    console.error("Error joining user to chats:", error);
  }
};

/**
 * Update user presence
 */
const updateUserPresence = async (userId, status = "online") => {
  try {
    await User.findByIdAndUpdate(userId, {
      status,
      lastSeen: new Date(),
    });

    // Emit presence update to all connected users
    io.emit("presence:update", {
      userId,
      status,
      lastSeen: new Date(),
    });
  } catch (error) {
    console.error("Error updating user presence:", error);
  }
};

// Socket connection handler
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const user = await authenticateSocket(token);
    if (!user) {
      return next(new Error("Authentication error: Invalid token"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", async (socket) => {
  console.log(`User ${socket.userId} connected`);

  // Store socket mapping
  userSockets.set(socket.userId, socket.id);

  // Update user presence
  await updateUserPresence(socket.userId, "online");

  // Join user to their chat rooms
  await joinUserToChats(socket, socket.userId);

  // Handle typing events
  socket.on("typing:start", async (data) => {
    const { chatId } = data;
    socket.to(`chat:${chatId}`).emit("typing:start", {
      chatId,
      userId: socket.userId,
      userName: socket.user.name,
    });
  });

  socket.on("typing:stop", async (data) => {
    const { chatId } = data;
    socket.to(`chat:${chatId}`).emit("typing:stop", {
      chatId,
      userId: socket.userId,
      userName: socket.user.name,
    });
  });

  // Handle new message
  socket.on("message:new", async (data, ack) => {
    try {
      const { chatId, text, media, replyTo } = data;
      if (!chatId) return ack && ack({ success: false, error: "chatId is required" });

      // Create message in database
      const message = await Message.create({
        chatId,
        sender: socket.userId,
        text,
        media: media || [],
        replyTo,
      });

      // Populate sender info
      await message.populate("sender", "name image handle")
      .populate({path : "system" , populate : {path : "targets" , select :"name image _id handle"}});


      // Populate replyTo if present
      if (replyTo) {
        await message.populate({
          path: "replyTo",
          select: "text sender media isDeleted",
          populate: {
            path: "sender",
            select: "name _id image",
          },
        });
      }

      // Update chat's last message
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: {
          content: text || "Media message",
          type:
            media && media.length > 0
              ? media[0].mime && media[0].mime.startsWith("image/")
                ? "image"
                : "file"
              : "text",
          senderId: socket.userId,
          createdAt: new Date(),
        },
      });

      // Emit to chat room (server is the single source of truth, client shouldn't also POST)
      io.to(`chat:${chatId}`).emit("message:new", {
        message,
        chatId,
      });

      // Create notifications for offline users
      const chat = await Chat.findById(chatId).populate("participants");
      const offlineUsers = chat.participants.filter(
        (participant) =>
          !userSockets.has(participant._id.toString()) &&
          participant._id.toString() !== socket.userId
      );

      for (const user of offlineUsers) {
        await Notification.create({
          to: user._id,
          type: "message",
          title: `${socket.user.name}`,
          body: text || "Sent you a message",
          data: { chatId, messageId: message._id },
          chatId,
          messageId: message._id,
          fromUser: socket.userId,
        });
      }

      return ack && ack({ success: true, message });
    } catch (error) {
      console.error("Error handling new message:", error);
      return ack && ack({ success: false, error: "Failed to send message" });
    }
  });

  // Handle message edit
  socket.on("message:edit", async (data) => {
    try {
      const { messageId, text, media } = data;
      console.log(text);
      const message = await Message.findByIdAndUpdate(
        messageId,
        { text, media: media || [], editedAt: new Date() },
        { new: true }
      ).populate("sender", "name image handle");

      if (message) {
        io.to(`chat:${message.chatId}`).emit("message:edit", {
          message,
          chatId: message.chatId,
        });
      }
    } catch (error) {
      console.error("Error handling message edit:", error);
    }
  });

  // Handle message delete
  socket.on("message:delete", async (data) => {
    try {
      const { messageId, deleteForEveryone } = data;
      console.log("Received message:delete event:", {
        messageId,
        deleteForEveryone,
        userId: socket.userId,
      });

      const message = await Message.findById(messageId);
      if (!message) {
        console.log("Message not found:", messageId);
        return;
      }

      if (deleteForEveryone) {
        // Check if within deletion window (2 minutes)
        const deleteWindow =
          parseInt(process.env.MESSAGE_DELETE_WINDOW) || 120000;
        const timeDiff = Date.now() - message.createdAt.getTime();

        console.log(
          "Delete for everyone - time diff:",
          timeDiff,
          "ms, window:",
          deleteWindow,
          "ms"
        );

        if (timeDiff <= deleteWindow) {
          message.isDeleted = true;
          message.text = "";
          message.media = [];
          await message.save();

          console.log(
            "Message deleted for everyone, emitting to chat:",
            message.chatId
          );

          io.to(`chat:${message.chatId}`).emit("message:delete", {
            messageId,
            chatId: message.chatId,
            deleteForEveryone: true,
          });
        } else {
          console.log("Message too old to delete for everyone");
          socket.emit("error", {
            message: "Message can only be deleted within 2 minutes",
          });
        }
      } else {
        // Delete for me only
        if (!message.deletedFor.includes(socket.userId)) {
          message.deletedFor.push(socket.userId);
          await message.save();

          console.log("Message deleted for user, emitting to user");

          socket.emit("message:delete", {
            messageId,
            chatId: message.chatId,
            deleteForEveryone: false,
          });
        }
      }
    } catch (error) {
      console.error("Error handling message delete:", error);
    }
  });

  // Handle reactions
  socket.on("reaction:add", async (data) => {
    try {
      const { messageId, emoji } = data;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Remove any existing reaction by this user to keep one reaction per user
      message.reactions = (message.reactions || []).filter(
        (r) => r.by.toString() !== socket.userId
      );
      // Add new reaction
      message.reactions.push({ emoji, by: socket.userId });

      await message.save();
      await message.populate("reactions.by", "name image handle");

      io.to(`chat:${message.chatId}`).emit("reaction:update", {
        messageId,
        reactions: message.reactions,
        chatId: message.chatId,
      });
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  });

  // Handle read receipts
  socket.on("message:read", async (data) => {
    try {
      const { messageId, chatId } = data;

      const message = await Message.findById(messageId);
      if (!message) return;

      if (!message.readBy.includes(socket.userId)) {
        message.readBy.push(socket.userId);
        await message.save();

        io.to(`chat:${chatId}`).emit("message:read", {
          messageId,
          userId: socket.userId,
          chatId,
        });
      }
    } catch (error) {
      console.error("Error handling read receipt:", error);
    }
  });

  // Handle friend request
  socket.on("friend:request", async (data) => {
    try {
      const { toUserId } = data;

      // Check if target user is online
      const targetSocketId = userSockets.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:request", {
          fromUser: socket.user,
          type: "new_request",
        });
      }
    } catch (error) {
      console.error("Error handling friend request:", error);
    }
  });

  // Handle friend status updates
  socket.on("friend:status", async (data) => {
    try {
      const { friendId, status } = data;

      // Emit to friend if online
      const friendSocketId = userSockets.get(friendId);
      if (friendSocketId) {
        io.to(friendSocketId).emit("friend:status", {
          userId: socket.userId,
          status,
        });
      }
    } catch (error) {
      console.error("Error handling friend status:", error);
    }
  });

  // Friend request lifecycle via sockets
  socket.on("friend:request:create", async (data, ack) => {
    try {
      const { handle, message } = data || {};
      if (!handle) return ack && ack({ success: false, error: "Handle is required" });

      const normalizedHandle = handle.replace("@", "");
      const targetUser = await User.findOne({ handle: normalizedHandle });
      if (!targetUser) return ack && ack({ success: false, error: "User not found" });
      if (targetUser._id.toString() === socket.userId) return ack && ack({ success: false, error: "Cannot send request to yourself" });

      // Block & friend checks
      const currentUser = await User.findById(socket.userId);
      if ((targetUser.blocked || []).map(String).includes(socket.userId)) return ack && ack({ success: false, error: "You are blocked by this user" });
      if ((currentUser.blocked || []).map(String).includes(targetUser._id.toString())) return ack && ack({ success: false, error: "Cannot send request to blocked user" });
      if ((currentUser.friends || []).map(String).includes(targetUser._id.toString())) return ack && ack({ success: false, error: "Already friends" });

      const existingPending = await FriendRequest.findOne({
        $or: [
          { from: socket.userId, to: targetUser._id, status: "pending" },
          { from: targetUser._id, to: socket.userId, status: "pending" },
        ],
      });
      if (existingPending) return ack && ack({ success: false, error: "Friend request already exists" });

      const friendRequest = await FriendRequest.create({
        from: socket.userId,
        to: targetUser._id,
        message: message || "",
        status: "pending",
      });

      const populated = await FriendRequest.findById(friendRequest._id)
        .populate("from", "name handle image status lastSeen")
        .populate("to", "name handle image status lastSeen");

      // Notification to target
      await Notification.create({
        to: targetUser._id,
        type: "friend_request",
        title: `${socket.user.name}`,
        body: message || "Sent you a friend request",
        data: { requestId: friendRequest._id, from: socket.userId },
        fromUser: socket.userId,
      });

      // Emit to target if online
      const targetSocketId = userSockets.get(targetUser._id.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:request:new", { request: populated });
      }

      return ack && ack({ success: true, request: populated });
    } catch (error) {
      console.error("friend:request:create error:", error);
      return ack && ack({ success: false, error: "Internal server error" });
    }
  });

  socket.on("friend:request:action", async (data, ack) => {
    try {
      const { requestId, action } = data || {};
      if (!requestId || !["accept", "reject", "cancel"].includes(action)) {
        return ack && ack({ success: false, error: "Invalid input" });
      }

      const reqDoc = await FriendRequest.findById(requestId);
      if (!reqDoc) return ack && ack({ success: false, error: "Request not found" });

      // Permission checks
      if (action === "cancel" && reqDoc.from.toString() !== socket.userId) {
        return ack && ack({ success: false, error: "Cannot cancel someone else's request" });
      }
      if (["accept", "reject"].includes(action) && reqDoc.to.toString() !== socket.userId) {
        return ack && ack({ success: false, error: "Cannot accept/reject not addressed to you" });
      }

      const fromId = reqDoc.from.toString();
      const toId = reqDoc.to.toString();

      if (action === "accept") {
        const [fromUser, toUser] = await Promise.all([
          User.findById(fromId),
          User.findById(toId),
        ]);
        if (fromUser && toUser) {
          if (!fromUser.friends.map(String).includes(toId)) fromUser.friends.push(toId);
          if (!toUser.friends.map(String).includes(fromId)) toUser.friends.push(fromId);
          await Promise.all([fromUser.save(), toUser.save()]);
        }
        await FriendRequest.findByIdAndDelete(requestId);

        // Notify both sides
        const payload = { requestId, from: fromId, to: toId };
        const fromSock = userSockets.get(fromId);
        const toSock = userSockets.get(toId);
        if (fromSock) io.to(fromSock).emit("friend:request:accepted", payload);
        if (toSock) io.to(toSock).emit("friend:request:accepted", payload);

        await Notification.create({
          to: fromId,
          type: "friend_request",
          title: "Friend request accepted",
          body: "Your friend request was accepted",
          data: { to: toId },
          fromUser: toId,
        });

        return ack && ack({ success: true, message: "accepted" });
      }

      if (action === "cancel") {
        await FriendRequest.findByIdAndDelete(requestId);
        const payload = { requestId, from: fromId, to: toId };
        const fromSock = userSockets.get(fromId);
        const toSock = userSockets.get(toId);
        if (fromSock) io.to(fromSock).emit("friend:request:cancelled", payload);
        if (toSock) io.to(toSock).emit("friend:request:cancelled", payload);
        return ack && ack({ success: true, message: "cancelled" });
      }

      if (action === "reject") {
        reqDoc.status = "rejected";
        await reqDoc.save();
        const populated = await FriendRequest.findById(requestId)
          .populate("from", "name handle image status lastSeen")
          .populate("to", "name handle image status lastSeen");
        const payload = { request: populated };
        const fromSock = userSockets.get(fromId);
        const toSock = userSockets.get(toId);
        if (fromSock) io.to(fromSock).emit("friend:request:rejected", payload);
        if (toSock) io.to(toSock).emit("friend:request:rejected", payload);
        return ack && ack({ success: true, request: populated });
      }

      return ack && ack({ success: false, error: "Unhandled action" });
    } catch (error) {
      console.error("friend:request:action error:", error);
      return ack && ack({ success: false, error: "Internal server error" });
    }
  });

  socket.on("friend:remove", async (data, ack) => {
    try {
      const { friendId } = data || {};
      if (!friendId) return ack && ack({ success: false, error: "friendId required" });

      const user = await User.findById(socket.userId);
      if (!user) return ack && ack({ success: false, error: "User not found" });

      user.friends = (user.friends || []).filter((id) => id.toString() !== friendId);
      await user.save();

      const friend = await User.findById(friendId);
      if (friend) {
        friend.friends = (friend.friends || []).filter((id) => id.toString() !== socket.userId);
        await friend.save();
      }

      const friendSock = userSockets.get(friendId);
      if (friendSock) io.to(friendSock).emit("friend:removed", { userId: socket.userId });
      return ack && ack({ success: true });
    } catch (error) {
      console.error("friend:remove error:", error);
      return ack && ack({ success: false, error: "Internal server error" });
    }
  });

  // Chat management events
  socket.on("chat:member:add", async (data, ack) => {
    try {
      const { chatId, userIds } = data || {};
      if (!chatId || !userIds?.length) return ack && ack({ success: false, error: "chatId and userIds required" });

      const chat = await Chat.findById(chatId).populate("participants", "name handle image status lastSeen").populate("admins", "name handle image");
      if (!chat) return ack && ack({ success: false, error: "Chat not found" });
      if (!chat.isGroup) return ack && ack({ success: false, error: "Cannot add members to direct chat" });

      // Check if user is admin
      const isAdmin = chat.admins.some(admin => admin._id.toString() === socket.userId);
      if (!isAdmin) return ack && ack({ success: false, error: "Only admins can add members" });

      // Add new participants
      const newParticipants = userIds.filter(id => !chat.participants.some(p => p._id.toString() === id));
      if (newParticipants.length === 0) return ack && ack({ success: false, error: "All users are already members" });

      chat.participants.push(...newParticipants);
      await chat.save();

      // Populate new participants
      const updatedChat = await Chat.findById(chatId)
        .populate("participants", "name handle image status lastSeen")
        .populate("admins", "name handle image")
        .populate("createdBy", "name handle image");

      // Create system message
      const systemMessage = await Message.create({
        chatId,
        sender: socket.userId,
        type: "system",
        text: "",
        system: { event: "member_added", targets: newParticipants },
      });
      await systemMessage.populate("sender", "name image handle");

      // Emit to all participants
      io.to(`chat:${chatId}`).emit("message:new", { message: systemMessage, chatId });
      io.to(`chat:${chatId}`).emit("chat:updated", { chat: updatedChat });

      return ack && ack({ success: true, chat: updatedChat });
    } catch (error) {
      console.error("chat:member:add error:", error);
      return ack && ack({ success: false, error: "Internal server error" });
    }
  });

  socket.on("chat:member:remove", async (data, ack) => {
    try {
      const { chatId, userId } = data || {};
      if (!chatId || !userId) return ack && ack({ success: false, error: "chatId and userId required" });

      const chat = await Chat.findById(chatId).populate("participants", "name handle image status lastSeen").populate("admins", "name handle image");
      if (!chat) return ack && ack({ success: false, error: "Chat not found" });
      if (!chat.isGroup) return ack && ack({ success: false, error: "Cannot remove members from direct chat" });

      // Check if user is admin or removing themselves
      const isAdmin = chat.admins.some(admin => admin._id.toString() === socket.userId);
      const isRemovingSelf = userId === socket.userId;
      if (!isAdmin && !isRemovingSelf) return ack && ack({ success: false, error: "Only admins can remove other members" });

      // Remove from participants and admins
      chat.participants = chat.participants.filter(p => p._id.toString() !== userId);
      chat.admins = chat.admins.filter(a => a._id.toString() !== userId);
      await chat.save();

      // Populate updated chat
      const updatedChat = await Chat.findById(chatId)
        .populate("participants", "name handle image status lastSeen")
        .populate("admins", "name handle image")
        .populate("createdBy", "name handle image");

      // Create system message
      const systemMessage = await Message.create({
        chatId,
        sender: socket.userId,
        type: "system",
        text: "",
        system: { event: "member_removed", targets: [userId] },
      });
      await systemMessage.populate("sender", "name image handle");

      // Emit to remaining participants
      io.to(`chat:${chatId}`).emit("message:new", { message: systemMessage, chatId });
      io.to(`chat:${chatId}`).emit("chat:updated", { chat: updatedChat });

      // If user left, remove them from the room
      if (isRemovingSelf) {
        const userSocketId = userSockets.get(userId);
        if (userSocketId) {
          io.to(userSocketId).emit("chat:left", { chatId });
        }
      }

      return ack && ack({ success: true, chat: updatedChat });
    } catch (error) {
      console.error("chat:member:remove error:", error);
      return ack && ack({ success: false, error: "Internal server error" });
    }
  });


  // Promote admin in group chat
  socket.on("admin:promote", async (data) => {
    try {
      const { chatId, userId } = data;
      if (!chatId || !userId) return;

      // Find the chat
      const chat = await Chat.findById(chatId)
        .populate("participants", "_id")
        .populate("admins", "_id")
        .populate("createdBy", "_id");

      if (!chat) {
        socket.emit("error", { message: "Chat not found" });
        return;
      }
      if (!chat.isGroup) {
        socket.emit("error", { message: "Only groups have admins" });
        return;
      }
      // Only the creator can promote admins
      if (!chat.createdBy || chat.createdBy._id.toString() !== socket.userId) {
        socket.emit("error", { message: "Only the creator can promote admins" });
        return;
      }
      // The user to be promoted must be a participant
      const isParticipant = chat.participants.some(
        (p) => p._id.toString() === userId
      );
      if (!isParticipant) {
        socket.emit("error", { message: "User is not a participant" });
        return;
      }

      // Promote: add userId to admins (ensures uniqueness)
      await Chat.updateOne({ _id: chatId }, { $addToSet: { admins: userId } });

      // Create a system message for the promotion event and emit it
      let systemMessage = null;
      try {
        systemMessage = await Message.create({
          chatId,
          sender: socket.userId,
          type: "system",
          text: "",
          system: { event: "admin_promoted", targets: [userId] },
        });
        if (systemMessage) {
          await systemMessage.populate("sender", "name image handle");
          io.to(`chat:${chatId}`).emit("message:new", {
            message: systemMessage,
            chatId,
          });
        }
      } catch (_) {
        // Ignore system message errors
      }

      // Return the updated chat with full info
      const updated = await Chat.findById(chatId)
        .populate("participants", "name handle image status lastSeen")
        .populate("admins", "name handle image")
        .populate("createdBy", "name handle image");

      // Notify all participants in the chat room
      io.to(`chat:${chatId}`).emit("admin:promoted", {
        chatId,
        userId,
        chat: updated,
      });
    } catch (error) {
      console.error("Error promoting admin:", error);
      socket.emit("error", { message: "Failed to promote admin" });
    }
  });

  // Demote admin in group chat
  socket.on("admin:demote", async (data) => {
    try {
      const { chatId, userId } = data;
      if (!chatId || !userId) return;

      // Find the chat
      const chat = await Chat.findById(chatId)
        .populate("admins", "_id")
        .populate("createdBy", "_id");

      if (!chat) {
        socket.emit("error", { message: "Chat not found" });
        return;
      }
      if (!chat.isGroup) {
        socket.emit("error", { message: "Only groups have admins" });
        return;
      }
      // Only the creator can demote admins
      if (!chat.createdBy || chat.createdBy._id.toString() !== socket.userId) {
        socket.emit("error", { message: "Only the creator can demote admins" });
        return;
      }

      // Demote: remove userId from admins
      await Chat.updateOne({ _id: chatId }, { $pull: { admins: userId } });

      // Create a system message for the demotion event and emit it
      let systemMessage = null;
      try {
        // Populate the targets (demoted user) with name, handle, image
        const demotedUser = await User.findById(userId).select("name handle image");
        systemMessage = await Message.create({
          chatId,
          sender: socket.userId,
          type: "system",
          text: "",
          system: { event: "admin_demoted", targets: demotedUser ? [demotedUser] : [] },
        });
        if (systemMessage) {
          await systemMessage.populate("sender", "name image handle");
          io.to(`chat:${chatId}`).emit("message:new", {
            message: systemMessage,
            chatId,
          });
        }
      } catch (_) {
        // Ignore system message errors
      }

      // Return the updated chat with full info
      const updated = await Chat.findById(chatId)
        .populate("participants", "name handle image status lastSeen")
        .populate("admins", "name handle image")
        .populate("createdBy", "name handle image");

      // Notify all participants in the chat room
      io.to(`chat:${chatId}`).emit("admin:demoted", {
        chatId,
        userId,
        chat: updated,
      });
    } catch (error) {
      console.error("Error demoting admin:", error);
      socket.emit("error", { message: "Failed to demote admin" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log(`User ${socket.userId} disconnected`);

    // Remove socket mapping
    userSockets.delete(socket.userId);
    userRooms.delete(socket.userId);

    // Update user presence
    await updateUserPresence(socket.userId, "offline");
  });
});

  // Start unified server (Next.js + Socket.IO)
  httpServer.listen(port, () => {
    console.log(`Unified server running on http://localhost:${port}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    httpServer.close(() => {
      console.log("HTTP server closed");
      mongoose.connection.close();
      process.exit(0);
    });
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
