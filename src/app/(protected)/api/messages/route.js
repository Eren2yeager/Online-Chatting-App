import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import User from '@/models/User.js';
import Chat from '@/models/Chat.js';
import Message from '@/models/Message.js';
import { messageCreateSchema } from '@/lib/validators.js';
import { ok, created, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api-helpers.js';
// Removed express-style rateLimit usage; not compatible with Next.js App Router

/**
 * POST /api/messages
 * Send a new message
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthorized();

    // Note: rate limiting disabled here for compatibility

    await connectDB();

    // Validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = await messageCreateSchema.parseAsync(body);
    } catch (error) {
      return badRequest('Validation failed', error.errors);
    }

    const { chatId, text, media, replyTo } = validatedData;
    const userId = session.user.id;

    // Verify chat exists and user is a participant - use lean() for better performance
    const chat = await Chat.findById(chatId)
      .select('participants')
      .lean();
      
    if (!chat) return notFound('Chat not found');

    const isParticipant = chat.participants.some(
      participantId => participantId.toString() === userId
    );

    if (!isParticipant) return forbidden('Not authorized to send messages in this chat');

    // Validate reply message exists if provided - use lean() and only select needed fields
    if (replyTo) {
      const replyMessage = await Message.findById(replyTo)
        .select('chatId')
        .lean();
      if (!replyMessage || replyMessage.chatId.toString() !== chatId) {
        return badRequest('Reply message not found or invalid');
      }
    }

    // Determine message type
    let messageType = 'text';
    if (media && media.length > 0) {
      const firstMedia = media[0];
      if (firstMedia.mime.startsWith('image/')) {
        messageType = 'image';
      } else if (firstMedia.mime.startsWith('video/')) {
        messageType = 'video';
      } else {
        messageType = 'file';
      }
    }

    // Create message
    const message = await Message.create({
      chatId,
      sender: userId,
      type: messageType,
      text: text || '',
      media: media || [],
      replyTo,
    });

    // Populate sender info
    await message.populate('sender', 'name image handle');
    if (replyTo) {
      await message.populate('replyTo', 'text sender');
    }

    // Update chat's last message and unread counts in a single operation
    const lastMessageContent = text || (media && media.length > 0 ? `${messageType} message` : '');
    const updateData = {
      lastMessage: {
        content: lastMessageContent,
        type: messageType,
        senderId: userId,
        createdAt: new Date()
      }
    };

    // Update unread counts for other participants using MongoDB's native operators
    const otherParticipants = chat.participants.filter(
      p => p.toString() !== userId
    );
    
    // Prepare the update operations for each participant
    const unreadCountsUpdates = otherParticipants.map(participantId => ({
      updateOne: {
        filter: { 
          _id: chatId,
          'unreadCounts.user': participantId 
        },
        update: { $inc: { 'unreadCounts.$.count': 1 } }
      }
    }));
    
    const newUnreadCounts = otherParticipants.map(participantId => ({
      updateOne: {
        filter: { 
          _id: chatId,
          'unreadCounts.user': { $ne: participantId } 
        },
        update: { 
          $push: { 
            unreadCounts: { 
              user: participantId, 
              count: 1 
            } 
          } 
        }
      }
    }));
    
    // Execute all updates in parallel
    await Promise.all([
      Chat.findByIdAndUpdate(chatId, updateData),
      Chat.bulkWrite([...unreadCountsUpdates, ...newUnreadCounts])
    ]);

    return created(message);

  } catch (error) {
    console.error('Error sending message:', error);
    return serverError();
  }
}

/**
 * GET /api/messages
 * Get messages for a chat
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthorized();

    await connectDB();

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const before = searchParams.get('before'); // Message ID to get messages before

    if (!chatId) return badRequest('Chat ID is required');

    // Verify chat exists and user is a participant - use lean() and only select needed fields
    const chat = await Chat.findById(chatId)
      .select('participants')
      .lean();
      
    if (!chat) return notFound('Chat not found');

    const isParticipant = chat.participants.some(p => p.toString() === userId);
    if (!isParticipant) return forbidden('Not authorized to view messages in this chat');

    // Build query with optimized before handling
    let query = { chatId };
    if (before) {
      const beforeMessage = await Message.findById(before)
        .select('createdAt')
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
        sender: 1,
        replyTo: 1,
        system: 1,
        reactions: 1,
        readBy: 1,
        isDeleted: 1,
        isEdited: 1
      })
      .populate('sender', 'name image handle')
      .populate({
        path: 'replyTo',
        select: 'text sender media isDeleted',
        populate: {
          path: 'sender',
          select: 'name _id image'
        }
      })
      .populate({path : "system" , populate : {path : "targets" , select :"name image _id handle"}})
      .populate('reactions.by', 'name image handle')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count - use estimatedDocumentCount when possible for better performance
    // Only use exact count when we need precise pagination
    const total = limit + offset < 1000 
      ? await Message.countDocuments({ chatId })
      : await Message.estimatedDocumentCount({ chatId });

    // Mark messages as read for current user - optimize with a single query
    const unreadMessageIds = messages
      .filter(message => 
        !message.readBy.includes(userId) && 
        message.sender.toString() !== userId
      )
      .map(m => m._id);

    if (unreadMessageIds.length > 0) {
      // Execute both updates in parallel for better performance
      await Promise.all([
        Message.updateMany(
          { _id: { $in: unreadMessageIds } },
          { $addToSet: { readBy: userId } }
        ),
        Chat.findByIdAndUpdate(chatId, {
          $pull: { unreadCounts: { user: userId } }
        })
      ]);
    }

    return ok(messages.reverse(), { pagination: { total, limit, offset, hasMore: offset + limit < total } });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return serverError();
  }
}
