import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.mjs';
import { ok, unauthorized, serverError, tooManyRequests } from '@/lib/api-helpers.js';
import { rateLimit, applyRateLimitHeaders } from '@/lib/rateLimit.js';

/**
 * GET /api/chats
 * Get chats for the authenticated user
 * 
 * Note: Chat creation is now handled by socket event 'chat:create'
 */
export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 100, 60 * 1000); // 100 requests per minute
    if (!rateLimitResult.success) {
      const response = tooManyRequests();
      applyRateLimitHeaders(response, rateLimitResult);
      return response;
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorized('Authentication required');
    }

    await connectDB();

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', '1:1', 'group'
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Build query
    let query = { participants: userId };
    if (type === '1:1') {
      query.isGroup = false;
    } else if (type === 'group') {
      query.isGroup = true;
    }

    // Get chats with pagination - optimize with projection and lean()
    let chats = await Chat.find(query, {
        // Explicitly select fields we need
        participants: 1,
        admins: 1,
        createdBy: 1,
        name: 1,
        image: 1,
        description: 1,
        privacy: 1,
        isGroup: 1,
        lastMessage: 1,
        unreadCounts: 1,
        updatedAt: 1,
        createdAt: 1
      })
      .populate('participants', 'name image handle status lastSeen')
      .populate('admins', 'name image handle')
      .populate('createdBy', 'name image handle')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Manually populate lastMessage with error handling
    const mongoose = await import('mongoose');
    for (const chat of chats) {
      if (chat.lastMessage) {
        try {
          // Validate ObjectId before populating
          if (mongoose.Types.ObjectId.isValid(chat.lastMessage)) {
            const Message = (await import('@/models/Message.mjs')).default;
            const lastMsg = await Message.findById(chat.lastMessage)
              .select('sender text type media createdAt isDeleted')
              .populate('sender', 'name image handle')
              .lean();
            chat.lastMessage = lastMsg;
          } else {
            // Invalid ObjectId - set to null
            console.warn(`Invalid lastMessage ObjectId in chat ${chat._id}: ${chat.lastMessage}`);
            chat.lastMessage = null;
            // Fix the database entry
            await Chat.findByIdAndUpdate(chat._id, { $unset: { lastMessage: 1 } });
          }
        } catch (error) {
          console.error(`Error populating lastMessage for chat ${chat._id}:`, error);
          chat.lastMessage = null;
        }
      }
    }

    // Sort by lastMessage time if available
    chats.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });

    // Get total count - use estimatedDocumentCount for better performance when possible
    const total = limit + offset < 1000 
      ? await Chat.countDocuments(query)
      : await Chat.estimatedDocumentCount(query);
    
    return ok({
      chats: chats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return serverError('Error fetching chats');
  }
}

/**
 * POST /api/chats
 * Create a new chat (direct or group)
 */
export async function POST(request) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 20, 60 * 1000); // 20 chat creations per minute
    if (!rateLimitResult.success) {
      const response = tooManyRequests();
      applyRateLimitHeaders(response, rateLimitResult);
      return response;
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorized('Authentication required');
    }

    await connectDB();

    const userId = session.user.id;
    const body = await request.json();
    const { isGroup, participants, name, description, privacy } = body;

    // Validate participants
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return serverError('Participants are required');
    }

    // For direct chats, ensure only 1 other participant
    if (!isGroup && participants.length !== 1) {
      return serverError('Direct chats must have exactly 1 other participant');
    }

    // For group chats, validate name
    if (isGroup && (!name || name.trim().length === 0)) {
      return serverError('Group name is required');
    }

    // Check if direct chat already exists
    if (!isGroup) {
      const otherUserId = participants[0];
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [userId, otherUserId], $size: 2 }
      });

      if (existingChat) {
        // Populate the existing chat before returning
        await existingChat.populate([
          { path: 'participants', select: 'name image handle status lastSeen' },
          { path: 'admins', select: 'name image handle' },
          { path: 'createdBy', select: 'name image handle' }
        ]);
        return ok({ chat: existingChat });
      }
    }

    // Create new chat
    const chatData = {
      isGroup: !!isGroup,
      participants: [userId, ...participants],
      createdBy: userId,
    };

    if (isGroup) {
      chatData.name = name.trim();
      chatData.description = description?.trim() || '';
      chatData.privacy = privacy || 'public';
      chatData.admins = [userId]; // Creator is admin
    }

    const chat = await Chat.create(chatData);

    // Populate the chat
    await chat.populate([
      { path: 'participants', select: 'name image handle status lastSeen' },
      { path: 'admins', select: 'name image handle' },
      { path: 'createdBy', select: 'name image handle' }
    ]);

    // Emit socket event to notify participants
    try {
      const { getIO } = await import('../../../../../server/server.mjs');
      const io = getIO();
      
      // Notify all participants about the new chat
      for (const participantId of chat.participants) {
        if (participantId.toString() !== userId) {
          io.to(`user:${participantId}`).emit("chat:created", {
            chat: chat.toObject(),
          });
        }
      }
    } catch (socketError) {
      console.error('Error emitting chat:created event:', socketError);
      // Don't fail the request if socket emission fails
    }

    return ok({ chat });

  } catch (error) {
    console.error('Error creating chat:', error);
    return serverError('Error creating chat');
  }
}
