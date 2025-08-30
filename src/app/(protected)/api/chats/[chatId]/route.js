import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import User from '@/models/User.js';
import { validateRequest, chatUpdateSchema } from '@/lib/validators.js';
import { rateLimit } from '@/lib/rateLimit.js';

/**
 * GET /api/chats/[chatId]
 * Get chat details
 */
export async function GET(request, { params }) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 100, 60 * 1000); // 100 requests per minute
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

    const { chatId } =await params;

    // Connect to database
    await connectDB();

    // Find the chat and populate participants
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name email image handle status lastSeen')
      .populate('admins', 'name email image handle')
      .populate('createdBy', 'name email image handle')
      .populate('lastMessage.senderId', 'name image');

    if (!chat) {
      return Response.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant._id.toString() === session.user.id
    );

    if (!isParticipant) {
      return Response.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user is admin
    const isAdmin = chat.admins.some(
      admin => admin._id.toString() === session.user.id
    );

    // Add user-specific data
    const chatData = chat.toObject();
    chatData.isAdmin = isAdmin;
    chatData.isParticipant = true;

    return Response.json({
      success: true,
      data: chatData
    });

  } catch (error) {
    console.error('Error fetching chat:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chats/[chatId]
 * Update chat settings (name, image, etc.)
 */
export async function PATCH(request, { params }) {
  try {
    // Rate limiting
    // const rateLimitResult = await rateLimit(request, 50, 60 * 1000); // 50 requests per minute
    // if (!rateLimitResult.success) {
    //   return Response.json(
    //     { success: false, error: 'Rate limit exceeded' },
    //     { status: 429 }
    //   );
    // }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    // const validation = await validateRequest(request, chatUpdateSchema);
    // if (!validation.success) {
    //   return Response.json(
    //     { success: false, error: validation.error },
    //     { status: 400 }
    //   );
    // }

    const { chatId } = params;
    const { name, image } = await request.json();

    // Connect to database
    await connectDB();

    // Find the chat
    const chat = await Chat.findById(chatId)
      .populate('admins', 'name email image handle');

    if (!chat) {
      return Response.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Check if user is an admin (only admins can update group settings)
    if (chat.isGroup) {
      const isAdmin = chat.admins.some(
        admin => admin._id.toString() === session.user.id
      );

      if (!isAdmin) {
        return Response.json(
          { success: false, error: 'Only admins can update group settings' },
          { status: 403 }
        );
      }
    } else {
      // For 1:1 chats, only participants can update
      const isParticipant = chat.participants.includes(session.user.id);
      if (!isParticipant) {
        return Response.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Update chat
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.avatar = image;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      updateData,
      { new: true }
    )
      .populate('participants', 'name email image handle status lastSeen')
      .populate('admins', 'name email image handle')
      .populate('createdBy', 'name email image handle')
      .populate('lastMessage.senderId', 'name image');

    return Response.json({
      success: true,
      data: updatedChat
    });

  } catch (error) {
    console.error('Error updating chat:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chats/[chatId]
 * Leave or delete a chat
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

    const { chatId } = await params;

    // Connect to database
    await connectDB();

    // Find the chat
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name email image handle')
      .populate('admins', 'name email image handle');

    if (!chat) {
      return Response.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
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
        return Response.json({
          success: true,
          message: 'Chat deleted'
        });
      }

      // If no admins left, make the first participant an admin
      if (chat.admins.length === 0 && chat.participants.length > 0) {
        chat.admins = [chat.participants[0]._id];
      }

      await chat.save();

      return Response.json({
        success: true,
        message: 'Left the group'
      });
    } else {
      // For 1:1 chats, remove both participants
      await Chat.findByIdAndDelete(chatId);
      return Response.json({
        success: true,
        message: 'Chat deleted'
      });
    }

  } catch (error) {
    console.error('Error leaving chat:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
