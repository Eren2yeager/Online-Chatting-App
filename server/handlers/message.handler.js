import Message from "../../src/models/Message.js";
import Chat from "../../src/models/Chat.js";
import Notification from "../../src/models/Notification.js";

/**
 * Register message-related event handlers
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {Map} userSockets - Map of userId to socketId
 */
export function registerMessageHandlers(socket, io, userSockets) {
  /**
   * Handle new message creation
   * Creates message in DB and broadcasts to all chat participants
   */
  socket.on("message:new", async (data, ack) => {
    try {
      const { chatId, text, media, replyTo } = data;

      // Validate required fields
      if (!chatId) {
        return ack?.({ success: false, error: "chatId is required" });
      }

      // Verify chat exists and user is a participant
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return ack?.({ success: false, error: "Chat not found" });
      }

      if (!chat.participants.some((p) => p.toString() === socket.userId)) {
        return ack?.({
          success: false,
          error: "You are not a participant in this chat",
        });
      }

      // Create message
      const message = await Message.create({
        chatId,
        sender: socket.userId,
        text,
        media: media || [],
        replyTo,
      });

      // Populate message with sender and reply info
      await message.populate([
        { path: "sender", select: "name image handle" },
        {
          path: "system.targets",
          select: "name image _id handle",
        },
        {
          path: "replyTo",
          select: "text sender media isDeleted",
          populate: { path: "sender", select: "name _id image" },
        },
      ]);

      // Update chat's last message and activity
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastActivity: new Date(),
      });

      // Update unread counts for all participants except sender
      await updateUnreadCounts(chat, socket.userId, io);

      // Broadcast to all chat participants
      io.to(`chat:${chatId}`).emit("message:new", {
        message,
        chatId,
      });

      // Create notifications for offline users
      await createMessageNotifications(
        chatId,
        message,
        socket,
        userSockets,
        io
      );

      ack?.({ success: true, message });
    } catch (error) {
      console.error("Error handling new message:", error);
      ack?.({
        success: false,
        error: "Failed to send message: " + (error.message || "Unknown error"),
      });
    }
  });

  /**
   * Handle message edit
   * Only allows editing own messages within 15 minute window
   */
  socket.on("message:edit", async (data, ack) => {
    try {
      const { messageId, text, media } = data;

      if (!messageId) {
        return ack?.({ success: false, error: "messageId is required" });
      }

      // Find and verify ownership
      const originalMessage = await Message.findById(messageId);
      if (!originalMessage) {
        return ack?.({ success: false, error: "Message not found" });
      }

      if (originalMessage.sender.toString() !== socket.userId) {
        return ack?.({
          success: false,
          error: "You can only edit your own messages",
        });
      }

      // Check 15-minute edit window
      const editWindow = 15 * 60 * 1000;
      const messageAge =
        Date.now() - new Date(originalMessage.createdAt).getTime();
      if (messageAge > editWindow) {
        return ack?.({ success: false, error: "Message is too old to edit" });
      }

      // Update message
      const message = await Message.findByIdAndUpdate(
        messageId,
        { text, media: media || [], editedAt: new Date() },
        { new: true }
      ).populate("sender", "name image handle");

      // Broadcast update
      io.to(`chat:${message.chatId}`).emit("message:edit", {
        message,
        chatId: message.chatId,
      });

      ack?.({ success: true, message });
    } catch (error) {
      console.error("Error handling message edit:", error);
      ack?.({
        success: false,
        error: "Failed to edit message: " + (error.message || "Unknown error"),
      });
    }
  });

  /**
   * Handle message deletion
   * Supports both "delete for me" and "delete for everyone" (within 2 min window)
   */
  socket.on("message:delete", async (data, ack) => {
    try {
      const { messageId, deleteForEveryone } = data;

      console.log(
        `Delete request: messageId=${messageId}, deleteForEveryone=${deleteForEveryone}, userId=${socket.userId}`
      );

      const message = await Message.findById(messageId);
      if (!message) {
        console.log("Message not found:", messageId);
        return ack?.({ success: false, error: "Message not found" });
      }

      if (deleteForEveryone) {
        // Verify ownership for delete-for-everyone
        if (message.sender.toString() !== socket.userId) {
          console.log("User not authorized to delete for everyone");
          return ack?.({
            success: false,
            error: "You can only delete your own messages for everyone",
          });
        }

        // Check 2-minute deletion window
        const deleteWindow = 2 * 60 * 1000; // 2 minutes
        const timeDiff = Date.now() - message.createdAt.getTime();
        const remainingTime = Math.ceil((deleteWindow - timeDiff) / 1000);

        console.log(
          `Time check: timeDiff=${timeDiff}ms, deleteWindow=${deleteWindow}ms, remaining=${remainingTime}s`
        );

        if (timeDiff <= deleteWindow) {
          message.isDeleted = true;
          message.text = "";
          message.media = [];
          await message.save();

          console.log("Message deleted for everyone:", messageId);

          // Emit to all users in the chat
          io.to(`chat:${message.chatId}`).emit("message:delete", {
            messageId,
            chatId: message.chatId,
            deleteForEveryone: true,
          });

          ack?.({ success: true });
        } else {
          const minutesAgo = Math.floor(timeDiff / 60000);
          console.log(`Delete window expired: ${minutesAgo} minutes ago`);
          return ack?.({
            success: false,
            error: `Can only delete within 2 minutes (sent ${minutesAgo} min ago)`,
          });
        }
      } else {
        // Delete for me only
        console.log("Deleting for user only:", socket.userId);

        if (!message.deletedFor.includes(socket.userId)) {
          message.deletedFor.push(socket.userId);
          await message.save();
        }

        // Emit only to this user
        socket.emit("message:delete", {
          messageId,
          chatId: message.chatId,
          deleteForEveryone: false,
        });

        console.log("Message deleted for user:", messageId);
        ack?.({ success: true });
      }
    } catch (error) {
      console.error("Error handling message delete:", error);
      ack?.({ success: false, error: "Failed to delete message" });
    }
  });

  /**
   * Handle reaction add/update
   * Each user can have one reaction per message
   */
  socket.on("reaction:add", async (data, ack) => {
    try {
      const { messageId, emoji } = data;

      // Use findOneAndUpdate with atomic operations to avoid version conflicts
      const message = await Message.findOneAndUpdate(
        { _id: messageId },
        [
          {
            $set: {
              reactions: {
                $concatArrays: [
                  {
                    $filter: {
                      input: { $ifNull: ["$reactions", []] },
                      cond: { $ne: ["$$this.by", socket.userId] },
                    },
                  },
                  [{ emoji, by: socket.userId }],
                ],
              },
            },
          },
        ],
        { new: true }
      ).populate("reactions.by", "name image handle");

      if (!message) {
        return ack?.({ success: false, error: "Message not found" });
      }

      // Broadcast reaction update
      io.to(`chat:${message.chatId}`).emit("reaction:update", {
        messageId,
        reactions: message.reactions,
        chatId: message.chatId,
      });

      ack?.({ success: true, reactions: message.reactions });
    } catch (error) {
      console.error("Error handling reaction:", error);
      ack?.({ success: false, error: "Failed to add reaction" });
    }
  });

  /**
   * Handle read receipts
   * Marks message as read by current user
   */
  socket.on("message:read", async (data, ack) => {
    try {
      const { messageId, chatId } = data;

      const message = await Message.findById(messageId);
      if (!message)
        return ack?.({ success: false, error: "Message not found" });

      if (!message.readBy.includes(socket.userId)) {
        message.readBy.push(socket.userId);
        await message.save();

        // Broadcast read receipt
        io.to(`chat:${chatId}`).emit("message:read", {
          messageId,
          userId: socket.userId,
          chatId,
        });
      }

      ack?.({ success: true });
    } catch (error) {
      console.error("Error handling read receipt:", error);
      ack?.({ success: false, error: "Failed to mark as read" });
    }
  });

  /**
   * Mark all messages in a chat as read
   * Resets unread count for the user
   */
  socket.on("chat:mark-read", async (data, ack) => {
    try {
      const { chatId } = data;

      if (!chatId) {
        return ack?.({ success: false, error: "chatId is required" });
      }

      // Verify chat exists and user is a participant
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return ack?.({ success: false, error: "Chat not found" });
      }

      if (!chat.participants.some((p) => p.toString() === socket.userId)) {
        return ack?.({
          success: false,
          error: "You are not a participant in this chat",
        });
      }

      // Reset unread count for this user
      const unreadEntry = chat.unreadCounts.find(
        (uc) => uc.user.toString() === socket.userId
      );

      if (unreadEntry) {
        unreadEntry.count = 0;
        await chat.save();
      }

      // Mark all unread messages as read
      await Message.updateMany(
        {
          chatId,
          sender: { $ne: socket.userId },
          readBy: { $ne: socket.userId },
        },
        { $addToSet: { readBy: socket.userId } }
      );

      // Emit to user's other sessions
      io.to(`user:${socket.userId}`).emit("unread:update", {
        chatId,
        count: 0,
      });

      // Emit to other chat participants
      io.to(`chat:${chatId}`).emit("chat:read", {
        chatId,
        userId: socket.userId,
      });

      ack?.({ success: true });
    } catch (error) {
      console.error("Error marking chat as read:", error);
      ack?.({
        success: false,
        error: "Failed to mark chat as read",
      });
    }
  });

  /**
   * Get unread counts for all chats
   */
  socket.on("unread:fetch", async (data, ack) => {
    try {
      const chats = await Chat.find({
        participants: socket.userId,
      }).select("_id unreadCounts");

      const unreadCounts = {};
      let totalUnread = 0;

      for (const chat of chats) {
        const unreadEntry = chat.unreadCounts?.find(
          (uc) => uc.user.toString() === socket.userId
        );
        const count = unreadEntry?.count || 0;
        unreadCounts[chat._id.toString()] = count;
        totalUnread += count;
      }

      ack?.({
        success: true,
        unreadCounts,
        totalUnread,
      });
    } catch (error) {
      console.error("Error fetching unread counts:", error);
      ack?.({
        success: false,
        error: "Failed to fetch unread counts",
      });
    }
  });
}

/**
 * Update unread counts for all participants except sender
 * @param {Object} chat - Chat object
 * @param {string} senderId - Sender user ID
 * @param {Object} io - Socket.IO instance
 */
async function updateUnreadCounts(chat, senderId, io) {
  try {
    // Initialize unreadCounts if not exists
    if (!chat.unreadCounts) {
      chat.unreadCounts = [];
    }

    // Update count for each participant except sender
    for (const participantId of chat.participants) {
      const participantIdStr = participantId.toString();

      if (participantIdStr === senderId) continue;

      const existingCount = chat.unreadCounts.find(
        (uc) => uc.user.toString() === participantIdStr
      );

      if (existingCount) {
        existingCount.count += 1;
      } else {
        chat.unreadCounts.push({
          user: participantId,
          count: 1,
        });
      }

      // Emit unread count update to this user
      io.to(`user:${participantIdStr}`).emit("unread:update", {
        chatId: chat._id,
        count: existingCount ? existingCount.count : 1,
      });
    }

    await chat.save();
  } catch (error) {
    console.error("Error updating unread counts:", error);
  }
}

/**
 * Create notifications for offline users about new message
 * @param {string} chatId - Chat ID
 * @param {Object} message - Message object
 * @param {Object} socket - Socket instance
 * @param {Map} userSockets - Map of online users
 * @param {Object} io - Socket.IO instance
 */
async function createMessageNotifications(
  chatId,
  message,
  socket,
  userSockets,
  io
) {
  try {
    const chat = await Chat.findById(chatId).populate("participants", "name");

    // Get chat name for notification
    let chatName = socket.user.name;
    if (chat.isGroup) {
      chatName = chat.name || "Group Chat";
    }

    for (const participant of chat.participants) {
      const participantIdStr = participant._id.toString();

      // Skip sender
      if (participantIdStr === socket.userId) continue;

      // Check if user is online
      const isOnline = userSockets.has(participantIdStr);

      // Create notification for offline users or users not in this chat
      if (!isOnline) {
        const notification = await Notification.create({
          to: participant._id,
          type: "message",
          title: chat.isGroup
            ? `${socket.user.name} in ${chatName}`
            : socket.user.name,
          body:
            message.text ||
            (message.media?.length > 0 ? "Sent a file" : "Sent a message"),
          data: { chatId, messageId: message._id },
          chatId,
          messageId: message._id,
          fromUser: socket.userId,
        });

        // Populate and emit
        await notification.populate("fromUser", "name image handle");

        const unreadCount = await Notification.countDocuments({
          to: participant._id,
          read: false,
        });

        io.to(`user:${participantIdStr}`).emit("notification:new", {
          notification: notification.toObject(),
          unreadCount,
        });
      }
    }
  } catch (error) {
    console.error("Error creating message notifications:", error);
  }
}
