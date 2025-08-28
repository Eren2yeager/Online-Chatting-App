import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import Chat from '../../../models/Chat';
import Message from '../../../models/Message';
import { messageCreateSchema } from '../../../lib/validators';
// Removed express-style rateLimit usage; not compatible with Next.js App Router

/**
 * POST /api/messages
 * Send a new message
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

    // Note: rate limiting disabled here for compatibility

    await connectDB();

    // Validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = await messageCreateSchema.parseAsync(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { chatId, text, media, replyTo } = validatedData;
    const userId = session.user.id;

    // Verify chat exists and user is a participant
    const chat = await Chat.findById(chatId).populate('participants');
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    const isParticipant = chat.participants.some(
      participant => participant._id.toString() === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to send messages in this chat' },
        { status: 403 }
      );
    }

    // Validate reply message exists if provided
    if (replyTo) {
      const replyMessage = await Message.findById(replyTo);
      if (!replyMessage || replyMessage.chatId.toString() !== chatId) {
        return NextResponse.json(
          { error: 'Reply message not found or invalid' },
          { status: 400 }
        );
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

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        content: text || (media && media.length > 0 ? `${messageType} message` : ''),
        type: messageType,
        senderId: userId,
        createdAt: new Date()
      }
    });

    // Update unread counts for other participants
    const otherParticipants = chat.participants.filter(
      p => p._id.toString() !== userId
    );

    for (const participant of otherParticipants) {
      const unreadCount = chat.unreadCounts.find(
        uc => uc.user.toString() === participant._id.toString()
      );

      if (unreadCount) {
        unreadCount.count += 1;
      } else {
        chat.unreadCounts.push({
          user: participant._id,
          count: 1
        });
      }
    }

    await chat.save();

    return NextResponse.json({
      success: true,
      data: message,
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messages
 * Get messages for a chat
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
    const chatId = searchParams.get('chatId');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const before = searchParams.get('before'); // Message ID to get messages before

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Verify chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    const isParticipant = chat.participants.includes(userId);
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to view messages in this chat' },
        { status: 403 }
      );
    }

    // Build query
    let query = { chatId };
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    // Get messages with pagination
    const messages = await Message.find(query)
      .populate('sender', 'name image handle')
      .populate('replyTo', 'text sender')
      .populate('reactions.by', 'name image handle')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count
    const total = await Message.countDocuments({ chatId });

    // Mark messages as read for current user
    const unreadMessages = messages.filter(
      message => !message.readBy.includes(userId) && 
      message.sender.toString() !== userId
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m._id);
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { readBy: userId } }
      );

      // Reset unread count for this user
      await Chat.findByIdAndUpdate(chatId, {
        $pull: { unreadCounts: { user: userId } }
      });
    }

    return NextResponse.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
