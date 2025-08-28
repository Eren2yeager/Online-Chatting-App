import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import Chat from '../../../models/Chat';
import { chatCreateSchema } from '../../../lib/validators';
// Removed express-style rateLimit middleware usage; not compatible with NextRequest

/**
 * POST /api/chats
 * Create a new chat (1:1 or group)
 */
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

    // Note: Rate limiting is disabled here because the express-style middleware
    // in lib/rateLimit is not compatible with Next.js App Router handlers.

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

    const { isGroup, name, participants } = validatedData;
    const userId = session.user.id;

    // Ensure current user is included in participants
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // Validate participants exist and are friends (for 1:1 chats)
    const participantUsers = await User.find({ _id: { $in: participants } });
    if (participantUsers.length !== participants.length) {
      return NextResponse.json(
        { error: 'One or more participants not found' },
        { status: 400 }
      );
    }

    // For 1:1 chats, ensure participants are friends
    if (!isGroup && participants.length === 2) {
      const currentUser = await User.findById(userId);
      const otherUser = participantUsers.find(p => p._id.toString() !== userId);
      
      if (!currentUser.friends.some(friendId => friendId.toString() === otherUser._id.toString())) {
        return NextResponse.json(
          { error: 'Can only create 1:1 chats with friends' },
          { status: 400 }
        );
      }
    }

    // Check if 1:1 chat already exists
    if (!isGroup && participants.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: participants }
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
      participants,
      admins: isGroup ? [userId] : [],
      createdBy: userId,
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
      { error: 'Internal server error' },
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
