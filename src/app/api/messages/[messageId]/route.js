import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';

// DELETE /api/messages/[messageId] - Delete a message
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const { deleteFor = 'me' } = await request.json();

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender or has permission to delete
    if (message.senderId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (deleteFor === 'everyone') {
      // Delete message for everyone
      await Message.findByIdAndDelete(messageId);
      
      // Update conversation's lastMessage if this was the last message
      const conversation = await Conversation.findById(message.conversationId);
      if (conversation?.lastMessage?.content === message.content) {
        // Find the previous message
        const previousMessage = await Message.findOne({
          conversationId: message.conversationId,
          _id: { $ne: messageId }
        }).sort({ createdAt: -1 });

        if (previousMessage) {
          await Conversation.findByIdAndUpdate(message.conversationId, {
            lastMessage: {
              content: previousMessage.content,
              type: previousMessage.type,
              senderId: previousMessage.senderId,
              createdAt: previousMessage.createdAt
            }
          });
        } else {
          // No more messages, clear lastMessage
          await Conversation.findByIdAndUpdate(message.conversationId, {
            $unset: { lastMessage: 1 }
          });
        }
      }
    } else {
      // For now, we'll just mark it as deleted for the user
      // In a real app, you might want to store this in a separate collection
      // For simplicity, we'll delete it completely
      await Message.findByIdAndDelete(messageId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
