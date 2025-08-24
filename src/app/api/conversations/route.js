import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import User from '@/models/User';

// GET /api/conversations - Get all conversations for the current user
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await Conversation.find({
      participants: session.user.id
    })
    .populate('participants', 'id name email image')
    .populate('lastMessage.senderId', 'id name')
    .sort({ updatedAt: -1 });

    // Transform data to match expected format
    const transformedConversations = conversations.map(conv => {
      // For 1-on-1 chats, get the other user's name
      let conversationName = conv.name;
      if (!conv.isGroup && conv.participants.length === 2) {
        const otherUser = conv.participants.find(p => p._id.toString() !== session.user.id);
        conversationName = otherUser?.name || 'Unknown User';
      }

      return {
        id: conv._id.toString(),
        name: conversationName,
        isGroup: conv.isGroup,
        participants: conv.participants.map(p => ({
          user: {
            id: p._id.toString(),
            name: p.name,
            email: p.email,
            image: p.image
          }
        })),
        lastMessage: conv.lastMessage ? {
          content: conv.lastMessage.content || '',
          type: conv.lastMessage.type || 'text',
          senderName: conv.lastMessage.senderId?.name || 'Unknown',
          createdAt: conv.lastMessage.createdAt || conv.updatedAt
        } : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });

    return NextResponse.json(transformedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantIds, name, isGroup = false } = await request.json();

    if (!participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }

    // Add current user to participants
    const allParticipantIds = [...new Set([session.user.id, ...participantIds])];

    // Check if conversation already exists (for 1-on-1 chats)
    if (!isGroup && allParticipantIds.length === 2) {
      const existingConversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: allParticipantIds }
      }).populate('participants', 'id name email image');

      if (existingConversation) {
        // Get the other user's name for 1-on-1 chats
        const otherUser = existingConversation.participants.find(p => p._id.toString() !== session.user.id);
        const conversationName = otherUser?.name || 'Unknown User';

        return NextResponse.json({
          id: existingConversation._id.toString(),
          name: conversationName,
          isGroup: existingConversation.isGroup,
          participants: existingConversation.participants.map(p => ({
            user: {
              id: p._id.toString(),
              name: p.name,
              email: p.email,
              image: p.image
            }
          })),
          lastMessage: existingConversation.lastMessage ? {
            content: existingConversation.lastMessage.content || '',
            type: existingConversation.lastMessage.type || 'text',
            senderName: existingConversation.lastMessage.senderId?.name || 'Unknown',
            createdAt: existingConversation.lastMessage.createdAt || existingConversation.updatedAt
          } : null,
          createdAt: existingConversation.createdAt,
          updatedAt: existingConversation.updatedAt
        });
      }
    }

    // Create new conversation
    const conversation = new Conversation({
      name: name || null,
      isGroup,
      participants: allParticipantIds
    });

    await conversation.save();

    // Populate the new conversation
    await conversation.populate('participants', 'id name email image');

    // Get the other user's name for 1-on-1 chats
    let conversationName = conversation.name;
    if (!conversation.isGroup && conversation.participants.length === 2) {
      const otherUser = conversation.participants.find(p => p._id.toString() !== session.user.id);
      conversationName = otherUser?.name || 'Unknown User';
    }

    return NextResponse.json({
      id: conversation._id.toString(),
      name: conversationName,
      isGroup: conversation.isGroup,
      participants: conversation.participants.map(p => ({
        user: {
          id: p._id.toString(),
          name: p.name,
          email: p.email,
          image: p.image
        }
      })),
      lastMessage: null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
