import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import User from '@/models/User.js';
import { validateRequest, chatUpdateSchema } from '@/lib/validators.js';
import { rateLimit, applyRateLimitHeaders } from '@/lib/rateLimit.js';
import { ok, badRequest, unauthorized, forbidden, notFound, serverError, tooManyRequests } from '@/lib/api-helpers.js';

/**
 * GET /api/chats/[chatId]
 * Get chat details
 */
export async function GET(request, { params }) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 100, 60 * 1000); // 100 requests per minute
    if (!rateLimitResult.success) {
      const response = tooManyRequests();
      applyRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorized('Authentication required');
    }

    const { chatId } =await params;

    // Connect to database
    await connectDB();

    // Find the chat and populate participants - optimize with a single populate call and projection
    const chat = await Chat.findById(chatId, {
        participants: 1,
        admins: 1,
        createdBy: 1,
        name: 1,
        isGroup: 1,
        lastMessage: 1,
        unreadCounts: 1,
        description: 1,
        image: 1,
        privacy: 1,
        createdAt: 1,
        updatedAt: 1
      })
      .populate([
        { path: 'participants', select: 'name email image handle status lastSeen' },
        { path: 'admins', select: 'name email image handle' },
        { path: 'createdBy', select: 'name email image handle' },
        { path: 'lastMessage.senderId', select: 'name image' }
      ]);

    if (!chat) {
      return notFound('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant._id.toString() === session.user.id
    );

    if (!isParticipant) {
      return forbidden('Access denied');
    }

    // Check if user is admin
    const isAdmin = chat.admins.some(
      admin => admin._id.toString() === session.user.id
    );

    // Add user-specific data
    const chatData = chat.toObject();
    chatData.isAdmin = isAdmin;
    chatData.isParticipant = true;

    return ok({ data: chatData });

  } catch (error) {
    console.error('Error fetching chat:', error);
    return serverError('Error fetching chat');
  }
}

/**
 * PATCH /api/chats/[chatId]
 * Update chat settings (name, image, etc.)
 * Note: This is now handled by socket event 'chat:update'
 * Route removed - use socket events for real-time updates
 */

/**
 * DELETE /api/chats/[chatId]
 * Leave or delete a chat
 */
export async function DELETE(request, { params }) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 50, 60 * 1000); // 50 requests per minute
    if (!rateLimitResult.success) {
      const response = tooManyRequests();
      applyRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorized('Authentication required');
    }

    const { chatId } = await params;

    // Connect to database
    await connectDB();

    // Find the chat - optimize with projection and a single populate call
    const chat = await Chat.findById(chatId, {
        participants: 1,
        admins: 1,
        isGroup: 1
      })
      .populate([
        { path: 'participants', select: 'name email image handle' },
        { path: 'admins', select: 'name email image handle' }
      ]);

    if (!chat) {
      return notFound('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant._id.toString() === session.user.id
    );

    if (!isParticipant) {
      return Response.json(
        { success: false, error: 'You are not a participant in this chat' },
        { status: 403 }
      );
    }

    if (chat.isGroup) {
      // For group chats, remove user from participants
      chat.participants = chat.participants.filter(
        participant => participant._id.toString() !== session.user.id
      );

      // Remove from admins if they were an admin
      chat.admins = chat.admins.filter(
        admin => admin._id.toString() !== session.user.id
      );

      // If no participants left, delete the chat
      if (chat.participants.length === 0) {
        await Chat.findByIdAndDelete(chatId);
        return ok({ message: 'Chat deleted' });
      }

      // If no admins left, make the first participant an admin
      if (chat.admins.length === 0 && chat.participants.length > 0) {
        chat.admins = [chat.participants[0]._id];
      }
      
      // Use findByIdAndUpdate for better performance than save()
      await Chat.findByIdAndUpdate(chatId, {
        participants: chat.participants.map(p => p._id),
        admins: chat.admins.map(a => typeof a === 'object' ? a._id : a)
      });

      return ok({ message: 'Left the group' });
    } else {
      // For 1:1 chats, remove both participants
      await Chat.findByIdAndDelete(chatId);
      return ok({ message: 'Chat deleted' });
    }

  } catch (error) {
    console.error('Error leaving chat:', error);
    return serverError('Error leaving chat');
  }
}
