import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import User from '@/models/User.js';
import Message from '@/models/Message.js';

// POST /api/chats/[chatId]/members
// Add one or more members to a group chat (admins only)
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } =await params;
    const body = await request.json();
    let { userIds, userId } = body || {};

    if (!Array.isArray(userIds)) {
      userIds = userId ? [userId] : [];
    }

    if (!userIds.length) {
      return Response.json({ success: false, error: 'No users provided' }, { status: 400 });
    } 

    await connectDB();

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name handle image')
      .populate('admins', 'name handle image');

    if (!chat) {
      return Response.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }

    if (!chat.isGroup) {
      return Response.json({ success: false, error: 'Can only add members to group chats' }, { status: 400 });
    }

    const isAdmin = chat.admins.some(a => a._id.toString() === session.user.id);
    if (!isAdmin) {
      return Response.json({ success: false, error: 'Only admins can add members' }, { status: 403 });
    }

    // Validate users exist
    const users = await User.find({ _id: { $in: userIds } }).select('_id friends');
    if (users.length !== userIds.length) {
      return Response.json({ success: false, error: 'One or more users not found' }, { status: 400 });
    }

    // Ensure each added user is a friend of the admin (session user)
    const adminUser = await User.findById(session.user.id).select('friends');
    const notFriends = users.filter(u => !adminUser.friends.some(fid => fid.toString() === u._id.toString()));
    if (notFriends.length > 0) {
      return Response.json({ success: false, error: 'You can only add your friends to the group' }, { status: 403 });
    }

    // Add participants uniquely
    const existingIds = new Set(chat.participants.map(p => p._id.toString()));
    const toAdd = users.map(u => u._id.toString()).filter(id => !existingIds.has(id));

    if (toAdd.length === 0) {
      const populated = await Chat.findById(chatId)
        .populate('participants', 'name image handle status lastSeen')
        .populate('admins', 'name image handle')
        .populate('createdBy', 'name image handle');
      return Response.json({ success: true, data: populated, message: 'No new members to add' });
    }

    chat.participants = [...chat.participants.map(p => p._id), ...toAdd];
    await chat.save();

    const updated = await Chat.findById(chatId)
      .populate('participants', 'name image handle status lastSeen')
      .populate('admins', 'name image handle')
      .populate('createdBy', 'name image handle');

    // Emit system message for added members
    try {
      await Message.create({
        chatId: chatId,
        sender: session.user.id,
        type: 'system',
        text: '',
        system: {
          event: 'member_added',
          targets: toAdd,
        }
      });
    } catch(_) {}

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Add members error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chats/[chatId]/members
// Remove a member from a group chat (self or admin)
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
      .populate('admins', 'name handle image');

    if (!chat) {
      return Response.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }

    if (!chat.isGroup) {
      return Response.json({ success: false, error: 'Can only remove members from group chats' }, { status: 400 });
    }

    const isAdmin = chat.admins.some(a => a._id.toString() === session.user.id);
    const isSelf = userId === session.user.id;

    if (!isAdmin && !isSelf) {
      return Response.json({ success: false, error: 'Only admins can remove other members' }, { status: 403 });
    }

    const isParticipant = chat.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      return Response.json({ success: false, error: 'User is not a member of this chat' }, { status: 400 });
    }

    chat.participants = chat.participants.filter(p => p._id.toString() !== userId);
    chat.admins = chat.admins.filter(a => a._id.toString() !== userId);

    // If no admins left but participants remain, promote first participant
    if (chat.isGroup && chat.admins.length === 0 && chat.participants.length > 0) {
      chat.admins = [chat.participants[0]._id];
    }

    await chat.save();

    const updated = await Chat.findById(chatId)
      .populate('participants', 'name image handle status lastSeen')
      .populate('admins', 'name image handle')
      .populate('createdBy', 'name image handle');

    // Emit system message for removed member
    try {
      await Message.create({
        chatId: chatId,
        sender: session.user.id,
        type: 'system',
        text: '',
        system: {
          event: 'member_removed',
          targets: [userId],
        }
      });
    } catch(_) {}

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Remove member error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


