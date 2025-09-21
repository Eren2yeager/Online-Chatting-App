import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Message from '@/models/Message.js';
import Chat from '@/models/Chat.js';
import { validateRequest, messageUpdateSchema, messageDeleteSchema } from '@/lib/validators.js';
import { rateLimit, applyRateLimitHeaders } from '@/lib/rateLimit.js';
import { ok, badRequest, unauthorized, forbidden, notFound, serverError, tooManyRequests } from '@/lib/api-helpers.js';

/**
 * PATCH /api/messages/[messageId]
 * Edit a message
 */
export async function PATCH(request, { params }) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 50, 60 * 1000); // 50 requests per minute
    if (!rateLimitResult.success) {
      const response = tooManyRequests();
      return applyRateLimitHeaders(response, rateLimitResult);
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorized();
    }

    // Validate request body
    const validation = await validateRequest(request, messageUpdateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }

    const { messageId } = params;
    const { text, media } = validation.data;

    // Connect to database
    await connectDB();

    // Find the message with optimized query (projection and combined populate)
    const message = await Message.findById(messageId)
      .select('sender chatId text media createdAt')
      .populate([{ path: 'sender', select: 'name image' }, { path: 'chatId', select: 'participants' }]);

    if (!message) {
      return notFound('Message not found');
    }

    // Check if user is the sender
    if (message.sender._id.toString() !== session.user.id) {
      return forbidden('You can only edit your own messages');
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const editWindow = 15 * 60 * 1000; // 15 minutes
    if (messageAge > editWindow) {
      return badRequest('Message is too old to edit');
    }

    // Update the message using findByIdAndUpdate for better performance
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { 
        text, 
        ...(media !== undefined && { media }), 
        editedAt: new Date() 
      },
      { new: true }
    ).populate([{ path: 'sender', select: 'name image' }, { path: 'chatId', select: 'participants' }]);

    // Update chat's last message if this was the last message
    const chat = await Chat.findById(updatedMessage.chatId._id);
    if (chat.lastMessage && chat.lastMessage.messageId.toString() === messageId) {
      // Use findByIdAndUpdate for better performance
      await Chat.findByIdAndUpdate(chat._id, {
        lastMessage: {
          messageId: updatedMessage._id,
          text: updatedMessage.text,
          senderId: updatedMessage.sender._id,
          createdAt: updatedMessage.createdAt
        }
      });
    }

    return ok({
      data: updatedMessage
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
      const response = tooManyRequests();
      return applyRateLimitHeaders(response, rateLimitResult);
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorized();
    }

    // Validate request body
    const validation = await validateRequest(request, messageDeleteSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }

    const { messageId } = params;
    const { deleteForEveryone } = validation.data;

    // Connect to database
    await connectDB();

    // Find the message with optimized query (projection and combined populate)
    const message = await Message.findById(messageId)
      .select('sender chatId text media createdAt isDeleted deletedFor')
      .populate([{ path: 'sender', select: 'name image' }, { path: 'chatId', select: 'participants' }]);

    if (!message) {
      return notFound('Message not found');
    }

    if (deleteForEveryone) {
      // Check if within deletion window (2 minutes)
      const deleteWindow = parseInt(process.env.MESSAGE_DELETE_WINDOW) || 120000;
      const timeDiff = Date.now() - message.createdAt.getTime();
      
      if (timeDiff <= deleteWindow) {
        // Use findByIdAndUpdate for better performance
        await Message.findByIdAndUpdate(messageId, {
          isDeleted: true,
          text: '',
          media: []
        });
        
        return ok({ message: 'Message deleted for everyone' });
      } else {
        return badRequest('Message can only be deleted within 2 minutes');
      }
    } else {
      // Delete for me only - use findByIdAndUpdate with $addToSet for better performance
      if (!message.deletedFor.includes(session.user.id)) {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deletedFor: session.user.id }
        });
      }
      
      return ok({ message: 'Message deleted for you' });
    }

  } catch (error) {
    console.error('Error deleting message:', error);
    return serverError();
  }
}
