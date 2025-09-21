import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import User from '@/models/User.js';
import Chat from '@/models/Chat.js';
import { chatCreateSchema } from '@/lib/validators.js';
import { ok, created, badRequest, unauthorized, serverError, tooManyRequests } from '@/lib/api-helpers.js';
import { rateLimit, applyRateLimitHeaders } from '@/lib/rateLimit.js';

/**
 * POST /api/chats
 * Create a new chat (1:1 or group)
 */
import mongoose from 'mongoose';

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

    // Validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = await chatCreateSchema.parseAsync(body);
    } catch (error) {
      return badRequest('Validation failed', { details: error.errors });
    }

    let { isGroup, name, participants } = validatedData;
    const userId = session.user.id;

    // Ensure all participant IDs are strings
    participants = participants.map(id => id.toString());

    // Ensure current user is included in participants
    if (!participants.includes(userId.toString())) {
      participants.push(userId.toString());
    }

    // Convert all participant IDs to ObjectId
    const participantObjectIds = participants.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        // Invalid ObjectId
        return null;
      }
    });

    if (participantObjectIds.includes(null)) {
      return badRequest('Invalid participant ID(s)');
    }

    // Validate participants exist and are friends (for 1:1 chats) - use lean() and projection
    const participantUsers = await User.find(
      { _id: { $in: participantObjectIds } },
      { _id: 1 }
    ).lean();
    
    if (participantUsers.length !== participantObjectIds.length) {
      return badRequest('One or more participants not found');
    }

    // For 1:1 chats, ensure participants are friends - optimize with projection
    if (!isGroup && participantObjectIds.length === 2) {
      const currentUser = await User.findById(userId, { friends: 1 }).lean();
      const otherUser = participantUsers.find(p => p._id.toString() !== userId.toString());

      if (!currentUser.friends.some(friendId => friendId.toString() === otherUser._id.toString())) {
        return badRequest('Can only create 1:1 chats with friends');
      }
    }

    // Check if 1:1 chat already exists (order-insensitive) - use lean() for better performance
    if (!isGroup && participantObjectIds.length === 2) {
      const existingChat = await Chat.findOne(
        {
          isGroup: false,
          participants: { $all: participantObjectIds, $size: 2 }
        },
        { _id: 1, participants: 1, admins: 1, createdBy: 1, name: 1, isGroup: 1 }
      ).lean();

      if (existingChat) {
        return ok({ data: existingChat, message: 'Chat already exists' });
      }
    }

    // Create new chat
    const chat = await Chat.create({
      isGroup,
      name: isGroup ? name : null,
      participants: participantObjectIds,
      admins: isGroup ? [new mongoose.Types.ObjectId(userId)] : [],
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    // Populate participant details - use a single populate operation for better performance
    await Chat.populate(chat, [
      { path: 'participants', select: 'name image handle status' },
      { path: 'admins', select: 'name image handle' },
      { path: 'createdBy', select: 'name image handle' }
    ]);

    return created({ data: chat });

  } catch (error) {
    console.error('Error creating chat:', error);
    return serverError('Error creating chat', { details: error?.message });
  }
}
/**
 * GET /api/chats
 * Get chats for the authenticated user
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
    const chats = await Chat.find(query, {
        // Explicitly select fields we need
        participants: 1,
        admins: 1,
        createdBy: 1,
        name: 1,
        isGroup: 1,
        lastMessage: 1,
        unreadCounts: 1,
        updatedAt: 1,
        createdAt: 1
      })
      .populate('participants', 'name image handle status lastSeen')
      .populate('admins', 'name image handle')
      .populate('createdBy', 'name image handle')
      .populate('lastMessage.senderId', 'name image handle')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

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
