import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.js";
import connectDB from "@/lib/mongodb.js";
import Chat from "@/models/Chat.js";
import Message from "@/models/Message.js";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from "@/lib/api-helpers.js";

/**
 * GET /api/messages
 * Get messages for a chat
 *
 * Note: Message sending is now handled by socket event 'message:new'
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthorized();

    await connectDB();

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;
    const before = searchParams.get("before"); // Message ID to get messages before

    if (!chatId) return badRequest("Chat ID is required");

    // Verify chat exists and user is a participant - use lean() and only select needed fields
    const chat = await Chat.findById(chatId).select("participants").lean();

    if (!chat) return notFound("Chat not found");

    const isParticipant = chat.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant)
      return forbidden("Not authorized to view messages in this chat");

    // Build query with optimized before handling
    let query = {
      chatId,
      // Exclude messages deleted by this user
      deletedFor: { $ne: userId },
    };

    if (before) {
      const beforeMessage = await Message.findById(before)
        .select("createdAt")
        .lean();
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    // Get messages with pagination - optimize population and use projection
    const messages = await Message.find(query, {
      // Explicitly select fields we need to reduce document size
      text: 1,
      type: 1,
      media: 1,
      createdAt: 1,
      updatedAt: 1,
      editedAt: 1,  // ✅ Added editedAt field
      sender: 1,
      replyTo: 1,
      system: 1,
      reactions: 1,
      readBy: 1,
      isDeleted: 1,
      isEdited: 1,
    })
      .populate("sender", "name image handle")
      .populate({
        path: "replyTo",
        select: "text sender media isDeleted",
        populate: {
          path: "sender",
          select: "name _id image",
        },
      })
      .populate({
        path: "system",
        populate: { path: "targets", select: "name image _id handle" },
      })
      .populate("reactions.by", "name image handle")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count - use estimatedDocumentCount when possible for better performance
    // Only use exact count when we need precise pagination
    // Also exclude messages deleted by this user
    const total =
      limit + offset < 1000
        ? await Message.countDocuments({ chatId, deletedFor: { $ne: userId } })
        : await Message.estimatedDocumentCount({
            chatId,
            deletedFor: { $ne: userId },
          });

    // Mark messages as read for current user - optimize with a single query
    const unreadMessageIds = messages
      .filter(
        (message) =>
          !message.readBy.includes(userId) &&
          message.sender.toString() !== userId
      )
      .map((m) => m._id);

    if (unreadMessageIds.length > 0) {
      // Execute both updates in parallel for better performance
      await Promise.all([
        Message.updateMany(
          { _id: { $in: unreadMessageIds } },
          { $addToSet: { readBy: userId } }
        ),
        Chat.findByIdAndUpdate(chatId, {
          $pull: { unreadCounts: { user: userId } },
        }),
      ]);
    }

    return ok(messages.reverse(), {
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return serverError();
  }
}
