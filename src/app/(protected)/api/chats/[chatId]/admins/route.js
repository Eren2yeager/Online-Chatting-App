import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import User from '@/models/User.js';
import Message from '@/models/Message.js';

// POST /api/chats/[chatId]/admins -> promote user to admin (admins only)
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;
    const { userId } = await request.json();
    if (!userId) {
      return Response.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name handle image')
      .populate('admins', 'name handle image')
      .populate('createdBy', 'name handle image');

    if (!chat) {
      return Response.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }
    if (!chat.isGroup) {
      return Response.json({ success: false, error: 'Only groups have admins' }, { status: 400 });
    }

    const isAdmin = chat.admins.some(a => a._id.toString() === session.user.id);
    if (!isAdmin) {
      return Response.json({ success: false, error: 'Only admins can promote' }, { status: 403 });
    }

    const isParticipant = chat.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      return Response.json({ success: false, error: 'User is not a participant' }, { status: 400 });
    }

    // Atomic promote
    await Chat.updateOne({ _id: chatId }, { $addToSet: { admins: userId } });

    // System message
    try {
      await Message.create({
        chatId,
        sender: session.user.id,
        type: 'system',
        text: '',
        system: { event: 'admin_promoted', targets: [userId] }
      });
    } catch (_) {}

    const updated = await Chat.findById(chatId)
      .populate('participants', 'name image handle status lastSeen')
      .populate('admins', 'name image handle')
      .populate('createdBy', 'name image handle');

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Promote admin error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chats/[chatId]/admins -> demote admin (creator only)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = params;
    const { userId } = await request.json();
    if (!userId) {
      return Response.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name handle image')
      .populate('admins', 'name handle image')
      .populate('createdBy', 'name handle image');

    if (!chat) {
      return Response.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }
    if (!chat.isGroup) {
      return Response.json({ success: false, error: 'Only groups have admins' }, { status: 400 });
    }

    // Only creator can demote admins
    if (chat.createdBy._id.toString() !== session.user.id) {
      return Response.json({ success: false, error: 'Only the creator can demote admins' }, { status: 403 });
    }

    // Atomic demote
    await Chat.updateOne({ _id: chatId }, { $pull: { admins: userId } });

    // System message
    try {
      await Message.create({
        chatId,
        sender: session.user.id,
        type: 'system',
        text: '',
        system: { event: 'admin_demoted', targets: [userId] }
      });
    } catch (_) {}

    const updated = await Chat.findById(chatId)
      .populate('participants', 'name image handle status lastSeen')
      .populate('admins', 'name image handle')
      .populate('createdBy', 'name image handle');

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Demote admin error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


