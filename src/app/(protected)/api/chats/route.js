import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import User from '@/models/User.js';
import Chat from '@/models/Chat.js';
import { chatCreateSchema } from '@/lib/validators.js';
// Removed express-style rateLimit middleware usage; not compatible with NextRequest

/**
 * POST /api/chats
 * Create a new chat (1:1 or group)
 */
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = await chatCreateSchema.parseAsync(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Invalid participant ID(s)' },
        { status: 400 }
      );
    }

    // Validate participants exist and are friends (for 1:1 chats)
    const participantUsers = await User.find({ _id: { $in: participantObjectIds } });
    if (participantUsers.length !== participantObjectIds.length) {
      return NextResponse.json(
        { error: 'One or more participants not found' },
        { status: 400 }
      );
    }

    // For 1:1 chats, ensure participants are friends
    if (!isGroup && participantObjectIds.length === 2) {
      const currentUser = await User.findById(userId);
      const otherUser = participantUsers.find(p => p._id.toString() !== userId.toString());

      if (!currentUser.friends.some(friendId => friendId.toString() === otherUser._id.toString())) {
        return NextResponse.json(
          { error: 'Can only create 1:1 chats with friends' },
          { status: 400 }
        );
      }
    }

    // Check if 1:1 chat already exists (order-insensitive)
    if (!isGroup && participantObjectIds.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: participantObjectIds, $size: 2 }
      });

      if (existingChat) {
        return NextResponse.json({
          success: true,
          data: existingChat,
          message: 'Chat already exists'
        });
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

    // Populate participant details
    await chat.populate('participants', 'name image handle status');
    await chat.populate('admins', 'name image handle');
    await chat.populate('createdBy', 'name image handle');

    return NextResponse.json({
      success: true,
      data: chat,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
/**
 * GET /api/chats
 * Get chats for the authenticated user
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    // Get chats with pagination
    const chats = await Chat.find(query)
      .populate('participants', 'name image handle status lastSeen')
      .populate('admins', 'name image handle')
      .populate('createdBy', 'name image handle')
      .populate('lastMessage.senderId', 'name image handle')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count
    const total = await Chat.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: chats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
