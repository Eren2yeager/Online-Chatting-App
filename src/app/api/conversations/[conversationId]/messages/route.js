import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';

// GET /api/conversations/[conversationId]/messages - Get messages for a conversation
export async function GET(request, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Check if user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(session.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get messages with sender information
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'id name image')
      .sort({ createdAt: 1 });

    // Transform messages to match expected format
    const transformedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      type: msg.type,
      mediaUrl: msg.mediaUrl,
      senderId: msg.senderId._id.toString(),
      conversationId: msg.conversationId.toString(),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      sender: {
        id: msg.senderId._id.toString(),
        name: msg.senderId.name,
        image: msg.senderId.image
      }
    }));

    return NextResponse.json(transformedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[conversationId]/messages - Send a new message
export async function POST(request, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { content, type = 'text', mediaUrl = null } = await request.json();

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { error: 'Message content or media is required' },
        { status: 400 }
      );
    }

    // Check if user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(session.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create the message
    const message = new Message({
      content: content || '',
      type,
      mediaUrl,
      senderId: session.user.id,
      conversationId
    });

    await message.save();

    // Update conversation's lastMessage and updatedAt
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content: content || `Sent ${type}`,
        type,
        senderId: session.user.id,
        createdAt: new Date()
      },
      updatedAt: new Date()
    });

    // Populate sender information for response
    await message.populate('senderId', 'id name image');

    const responseMessage = {
      id: message._id.toString(),
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      senderId: message.senderId._id.toString(),
      conversationId: message.conversationId.toString(),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: {
        id: message.senderId._id.toString(),
        name: message.senderId.name,
        image: message.senderId.image
      }
    };

    return NextResponse.json(responseMessage, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
