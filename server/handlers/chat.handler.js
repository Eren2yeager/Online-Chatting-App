import Chat from "../../src/models/Chat.js";
import Message from "../../src/models/Message.js";

/**
 * Register chat management event handlers
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {Map} userSockets - Map of userId to socketId
 */
export function registerChatHandlers(socket, io, userSockets) {
  /**
   * Add members to a group chat (admin only)
   */
  socket.on("chat:member:add", async (data, ack) => {
    try {
      const { chatId, userIds } = data || {};

      if (!chatId || !userIds?.length) {
        return ack?.({ success: false, error: "chatId and userIds required" });
      }

      const chat = await Chat.findById(chatId)
        .populate("participants", "name handle image status lastSeen")
        .populate("admins", "name handle image");

      if (!chat) {
        return ack?.({ success: false, error: "Chat not found" });
      }

      if (!chat.isGroup) {
        return ack?.({
          success: false,
          error: "Cannot add members to direct chat",
        });
      }

      // Check permissions: admin can always add, or members can add if privacy allows
      const isAdmin = chat.admins.some(
        (admin) => admin._id.toString() === socket.userId
      );
      const isMember = chat.participants.some(
        (p) => p._id.toString() === socket.userId
      );
      
      if (!isMember) {
        return ack?.({ success: false, error: "You are not a member of this chat" });
      }
      
      if (!isAdmin && chat.privacy !== "member_invite") {
        return ack?.({ success: false, error: "Only admins can add members" });
      }

      // Filter out users already in chat
      const newParticipants = userIds.filter(
        (id) => !chat.participants.some((p) => p._id.toString() === id)
      );

      if (newParticipants.length === 0) {
        return ack?.({
          success: false,
          error: "All users are already members",
        });
      }

      // Add new participants
      chat.participants.push(...newParticipants);
      await chat.save();

      // Get updated chat with populated fields
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

      // Broadcast to all participants
      io.to(`chat:${chatId}`).emit("message:new", {
        message: systemMessage,
        chatId,
      });
      io.to(`chat:${chatId}`).emit("chat:updated", { chat: updatedChat });

      ack?.({ success: true, chat: updatedChat });
    } catch (error) {
      console.error("chat:member:add error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Remove member from group chat (admin or self)
   */
  socket.on("chat:member:remove", async (data, ack) => {
    try {
      const { chatId, userId } = data || {};

      if (!chatId || !userId) {
        return ack?.({ success: false, error: "chatId and userId required" });
      }

      const chat = await Chat.findById(chatId)
        .populate("participants", "name handle image status lastSeen")
        .populate("admins", "name handle image");

      if (!chat) {
        return ack?.({ success: false, error: "Chat not found" });
      }

      if (!chat.isGroup) {
        return ack?.({
          success: false,
          error: "Cannot remove members from direct chat",
        });
      }

      // Check permissions (admin or removing self)
      const isAdmin = chat.admins.some(
        (admin) => admin._id.toString() === socket.userId
      );
      const isRemovingSelf = userId === socket.userId;

      if (!isAdmin && !isRemovingSelf) {
        return ack?.({
          success: false,
          error: "Only admins can remove other members",
        });
      }

      // Remove from participants and admins
      chat.participants = chat.participants.filter(
        (p) => p._id.toString() !== userId
      );
      chat.admins = chat.admins.filter((a) => a._id.toString() !== userId);
      await chat.save();

      // Get updated chat
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

      // Broadcast to remaining participants
      io.to(`chat:${chatId}`).emit("message:new", {
        message: systemMessage,
        chatId,
      });
      io.to(`chat:${chatId}`).emit("chat:updated", { chat: updatedChat });

      // Notify removed user
      if (isRemovingSelf) {
        const userSocketId = userSockets.get(userId);
        if (userSocketId) {
          io.to(userSocketId).emit("chat:left", { chatId });
        }
      }

      ack?.({ success: true, chat: updatedChat });
    } catch (error) {
      console.error("chat:member:remove error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Join a specific chat room
   */
  socket.on("chat:join", async (data, ack) => {
    try {
      const { chatId } = data || {};

      if (!chatId) {
        return ack?.({ success: false, error: "chatId required" });
      }

      // Verify user is a participant of this chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return ack?.({ success: false, error: "Chat not found" });
      }

      const isParticipant = chat.participants.some(
        (p) => p.toString() === socket.userId
      );

      if (!isParticipant) {
        return ack?.({ success: false, error: "Not a participant of this chat" });
      }

      // Join the chat room
      const chatRoom = `chat:${chatId}`;
      socket.join(chatRoom);
      
      console.log(`User ${socket.userId} joined chat room: ${chatRoom}`);
      ack?.({ success: true });
    } catch (error) {
      console.error("chat:join error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Create a new chat (direct or group)
   */
  socket.on("chat:create", async (data, ack) => {
    try {
      const { participants, isGroup, name, image, description } = data || {};

      if (!participants || participants.length === 0) {
        return ack?.({ success: false, error: "Participants required" });
      }

      // Ensure current user is in participants
      const allParticipants = [...new Set([socket.userId, ...participants])];

      // For direct chats, check if chat already exists
      if (!isGroup && allParticipants.length === 2) {
        const existingChat = await Chat.findOne({
          isGroup: false,
          participants: { $all: allParticipants, $size: 2 },
        })
          .populate("participants", "name handle image status lastSeen")
          .populate("lastMessage");

        if (existingChat) {
          return ack?.({ success: true, chat: existingChat, existing: true });
        }
      }

      // Create new chat
      const chatData = {
        participants: allParticipants,
        isGroup: isGroup || false,
        createdBy: socket.userId,
        lastActivity: new Date(),
      };

      if (isGroup) {
        chatData.name = name || "New Group";
        chatData.image = image || "/user.jpg";
        chatData.description = description || "";
        chatData.admins = [socket.userId];
      }

      const chat = await Chat.create(chatData);

      // Populate chat
      const populatedChat = await Chat.findById(chat._id)
        .populate("participants", "name handle image status lastSeen")
        .populate("admins", "name handle image")
        .populate("createdBy", "name handle image");

      // Join all participants to the new chat room
      const { joinParticipantsToChat } = await import("../utils/rooms.js");
      joinParticipantsToChat(io, chat._id, allParticipants, userSockets);

      // Notify all participants
      for (const participantId of allParticipants) {
        io.to(`user:${participantId}`).emit("chat:created", {
          chat: populatedChat,
        });
      }

      ack?.({ success: true, chat: populatedChat });
    } catch (error) {
      console.error("chat:create error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Update chat settings (name, image, description, privacy)
   */
  socket.on("chat:update", async (data, ack) => {
    try {
      const { chatId, name, image, description, privacy } = data || {};

      if (!chatId) {
        return ack?.({ success: false, error: "chatId required" });
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return ack?.({ success: false, error: "Chat not found" });
      }

      if (!chat.isGroup) {
        return ack?.({
          success: false,
          error: "Cannot update direct chat settings",
        });
      }

      // Check if user is admin
      const isAdmin = chat.admins.some(
        (admin) => admin.toString() === socket.userId
      );
      if (!isAdmin) {
        return ack?.({
          success: false,
          error: "Only admins can update chat settings",
        });
      }

      // Track changes for system messages
      const changes = {};
      if (name && name !== chat.name) {
        changes.name = { previous: chat.name, next: name };
        chat.name = name;
      }
      if (image && image !== chat.image) {
        changes.image = { previous: chat.image, next: image };
        chat.image = image;
      }
      if (description !== undefined) {
        chat.description = description;
      }
      if (privacy && ["admin_only", "member_invite"].includes(privacy)) {
        chat.privacy = privacy;
      }

      await chat.save();

      // Get updated chat
      const updatedChat = await Chat.findById(chatId)
        .populate("participants", "name handle image status lastSeen")
        .populate("admins", "name handle image")
        .populate("createdBy", "name handle image");

      // Create system messages for name/image changes
      if (changes.name) {
        const systemMessage = await Message.create({
          chatId,
          sender: socket.userId,
          type: "system",
          text: "",
          system: {
            event: "name_changed",
            previous: changes.name.previous,
            next: changes.name.next,
          },
        });
        await systemMessage.populate("sender", "name image handle");
        io.to(`chat:${chatId}`).emit("message:new", {
          message: systemMessage,
          chatId,
        });
      }

      if (changes.image) {
        const systemMessage = await Message.create({
          chatId,
          sender: socket.userId,
          type: "system",
          text: "",
          system: {
            event: "image_changed",
            previous: changes.image.previous,
            next: changes.image.next,
          },
        });
        await systemMessage.populate("sender", "name image handle");
        io.to(`chat:${chatId}`).emit("message:new", {
          message: systemMessage,
          chatId,
        });
      }

      // Broadcast update
      io.to(`chat:${chatId}`).emit("chat:updated", { chat: updatedChat });

      ack?.({ success: true, chat: updatedChat });
    } catch (error) {
      console.error("chat:update error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Promote user to admin (creator only)
   */
  socket.on("admin:promote", async (data, ack) => {
    try {
      const { chatId, userId } = data || {};

      if (!chatId || !userId) {
        return ack?.({ success: false, error: "chatId and userId required" });
      }

      const chat = await Chat.findById(chatId)
        .populate("participants", "_id")
        .populate("admins", "_id")
        .populate("createdBy", "_id");

      if (!chat) {
        return ack?.({ success: false, error: "Chat not found" });
      }

      if (!chat.isGroup) {
        return ack?.({ success: false, error: "Only groups have admins" });
      }

      // Only creator can promote admins
      if (chat.createdBy._id.toString() !== socket.userId) {
        return ack?.({
          success: false,
          error: "Only the creator can promote admins",
        });
      }

      // Check if user is a participant
      const isParticipant = chat.participants.some(
        (p) => p._id.toString() === userId
      );
      if (!isParticipant) {
        return ack?.({ success: false, error: "User is not a participant" });
      }

      // Check if already admin
      const isAlreadyAdmin = chat.admins.some(
        (a) => a._id.toString() === userId
      );
      if (isAlreadyAdmin) {
        return ack?.({ success: false, error: "User is already an admin" });
      }

      // Add to admins
      chat.admins.push(userId);
      await chat.save();

      // Get updated chat
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
        system: { event: "admin_promoted", targets: [userId] },
      });
      await systemMessage.populate("sender", "name image handle");

      // Broadcast
      io.to(`chat:${chatId}`).emit("message:new", {
        message: systemMessage,
        chatId,
      });
      io.to(`chat:${chatId}`).emit("chat:updated", { chat: updatedChat });

      ack?.({ success: true, chat: updatedChat });
    } catch (error) {
      console.error("admin:promote error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  /**
   * Demote admin to regular member (creator only)
   */
  socket.on("admin:demote", async (data, ack) => {
    try {
      const { chatId, userId } = data || {};

      if (!chatId || !userId) {
        return ack?.({ success: false, error: "chatId and userId required" });
      }

      const chat = await Chat.findById(chatId)
        .populate("participants", "_id")
        .populate("admins", "_id")
        .populate("createdBy", "_id");

      if (!chat) {
        return ack?.({ success: false, error: "Chat not found" });
      }

      if (!chat.isGroup) {
        return ack?.({ success: false, error: "Only groups have admins" });
      }

      // Only creator can demote admins
      if (chat.createdBy._id.toString() !== socket.userId) {
        return ack?.({
          success: false,
          error: "Only the creator can demote admins",
        });
      }

      // Cannot demote creator
      if (userId === chat.createdBy._id.toString()) {
        return ack?.({ success: false, error: "Cannot demote the creator" });
      }

      // Check if user is admin
      const isAdmin = chat.admins.some((a) => a._id.toString() === userId);
      if (!isAdmin) {
        return ack?.({ success: false, error: "User is not an admin" });
      }

      // Remove from admins
      chat.admins = chat.admins.filter((a) => a._id.toString() !== userId);
      await chat.save();

      // Get updated chat
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
        system: { event: "admin_demoted", targets: [userId] },
      });
      await systemMessage.populate("sender", "name image handle");

      // Broadcast
      io.to(`chat:${chatId}`).emit("message:new", {
        message: systemMessage,
        chatId,
      });
      io.to(`chat:${chatId}`).emit("chat:updated", { chat: updatedChat });

      ack?.({ success: true, chat: updatedChat });
    } catch (error) {
      console.error("admin:demote error:", error);
      ack?.({ success: false, error: "Internal server error" });
    }
  });
}
