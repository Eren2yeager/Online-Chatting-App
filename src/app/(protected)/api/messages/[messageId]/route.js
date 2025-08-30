import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Message from '@/models/Message.js';
import Chat from '@/models/Chat.js';
import { validateRequest, messageUpdateSchema, messageDeleteSchema } from '@/lib/validators.js';
import { rateLimit } from '@/lib/rateLimit.js';
import { NextResponse } from 'next/server';

/**
 * PATCH /api/messages/[messageId]
 * Edit a message
 */
export async function PATCH(request, { params }) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 50, 60 * 1000); // 50 requests per minute
    if (!rateLimitResult.success) {
      return Response.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, messageUpdateSchema);
    if (!validation.success) {
      return Response.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { messageId } = params;
    const { text, media } = validation.data;

    // Connect to database
    await connectDB();

    // Find the message
    const message = await Message.findById(messageId)
      .populate('sender', 'name image')
      .populate('chatId', 'participants');

    if (!message) {
      return Response.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    // Check if user is the sender
    if (message.sender._id.toString() !== session.user.id) {
      return Response.json(
        { success: false, error: 'You can only edit your own messages' },
        { status: 403 }
      );
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const editWindow = 15 * 60 * 1000; // 15 minutes
    if (messageAge > editWindow) {
      return Response.json(
        { success: false, error: 'Message is too old to edit' },
        { status: 400 }
      );
    }

    // Update the message
    message.text = text;
    if (media !== undefined) {
      message.media = media;
    }
    message.editedAt = new Date();
    await message.save();

    // Update chat's last message if this was the last message
    const chat = await Chat.findById(message.chatId._id);
    if (chat.lastMessage && chat.lastMessage.messageId.toString() === messageId) {
      chat.lastMessage = {
        messageId: message._id,
        text: message.text,
        senderId: message.sender._id,
        createdAt: message.createdAt
      };
      await chat.save();
    }

    return Response.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Error updating message:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages/[messageId]
 * Delete a message (for me or for everyone)
 */
export async function DELETE(request, { params }) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 50, 60 * 1000); // 50 requests per minute
    if (!rateLimitResult.success) {
      return Response.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, messageDeleteSchema);
    if (!validation.success) {
      return Response.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { messageId } = params;
    const { deleteForEveryone } = validation.data;

    // Connect to database
    await connectDB();

    // Find the message
    const message = await Message.findById(messageId)
      .populate('sender', 'name image')
      .populate('chatId', 'participants');

    if (!message) {
      return Response.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    if (deleteForEveryone) {
      // Check if within deletion window (2 minutes)
      const deleteWindow = parseInt(process.env.MESSAGE_DELETE_WINDOW) || 120000;
      const timeDiff = Date.now() - message.createdAt.getTime();
      
      if (timeDiff <= deleteWindow) {
        message.isDeleted = true;
        message.text = '';
        message.media = [];
        await message.save();
        
        return NextResponse.json({ success: true, message: 'Message deleted for everyone' });
      } else {
        return NextResponse.json(
          { success: false, message: 'Message can only be deleted within 2 minutes' },
          { status: 400 }
        );
      }
    } else {
      // Delete for me only
      if (!message.deletedFor.includes(session.user.id)) {
        message.deletedFor.push(session.user.id);
        await message.save();
      }
      
      return NextResponse.json({ success: true, message: 'Message deleted for you' });
    }

  } catch (error) {
    console.error('Error deleting message:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
