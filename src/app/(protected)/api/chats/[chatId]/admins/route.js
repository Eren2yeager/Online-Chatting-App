import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import Message from '@/models/Message.js';

/**
 * POST /api/chats/[chatId]/admins
 * Promote a user to admin in a group chat.
 * Only the group creator can promote admins.
 */
export async function POST(request, { params }) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // User must be authenticated
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = params;
    const { userId } = await request.json();
    if (!userId) {
      // Must provide userId to promote
      return Response.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    // Find the chat and populate necessary fields
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name handle image')
      .populate('admins', 'name handle image')
      .populate('createdBy', 'name handle image');

    if (!chat) {
      // Chat must exist
      return Response.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }
    if (!chat.isGroup) {
      // Only group chats have admins
      return Response.json({ success: false, error: 'Only groups have admins' }, { status: 400 });
    }

    // Only the creator can promote admins
    if (!chat.createdBy || chat.createdBy._id.toString() !== session.user.id) {
      return Response.json({ success: false, error: 'Only the creator can promote admins' }, { status: 403 });
    }

    // The user to be promoted must be a participant
    const isParticipant = chat.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      return Response.json({ success: false, error: 'User is not a participant' }, { status: 400 });
    }

    // Promote: add userId to admins (ensures uniqueness)
    await Chat.updateOne({ _id: chatId }, { $addToSet: { admins: userId } });

    // Create a system message for the promotion event
    try {
      await Message.create({
        chatId,
        sender: session.user.id,
        type: 'system',
        text: '',
        system: { event: 'admin_promoted', targets: [userId] }
      });
    } catch (_) {
      // Ignore system message errors
    }

    // Return the updated chat with full info
    const updated = await Chat.findById(chatId)
      .populate('participants', 'name handle image status lastSeen')
      .populate('admins', 'name handle image')
      .populate('createdBy', 'name handle image');

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Promote admin error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/chats/[chatId]/admins
 * Demote an admin in a group chat.
 * Only the group creator can demote admins.
 */
export async function DELETE(request, { params }) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // User must be authenticated
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = params;
    const { userId } = await request.json();
    if (!userId) {
      // Must provide userId to demote
      return Response.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    // Find the chat and populate necessary fields
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name handle image')
      .populate('admins', 'name handle image')
      .populate('createdBy', 'name handle image');

    if (!chat) {
      // Chat must exist
      return Response.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }
    if (!chat.isGroup) {
      // Only group chats have admins
      return Response.json({ success: false, error: 'Only groups have admins' }, { status: 400 });
    }

    // Only the creator can demote admins
    if (!chat.createdBy || chat.createdBy._id.toString() !== session.user.id) {
      return Response.json({ success: false, error: 'Only the creator can demote admins' }, { status: 403 });
    }

    // Demote: remove userId from admins
    await Chat.updateOne({ _id: chatId }, { $pull: { admins: userId } });

    // Create a system message for the demotion event
    try {
      await Message.create({
        chatId,
        sender: session.user.id,
        type: 'system',
        text: '',
        system: { event: 'admin_demoted', targets: [userId] }
      });
    } catch (_) {
      // Ignore system message errors
    }

    // Return the updated chat with full info
    const updated = await Chat.findById(chatId)
      .populate('participants', 'name handle image status lastSeen')
      .populate('admins', 'name handle image')
      .populate('createdBy', 'name handle image');

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Demote admin error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
