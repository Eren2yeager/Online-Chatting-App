import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Message from '@/models/Message.js';
import Chat from '@/models/Chat.js';
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api-helpers.js';

// POST /api/messages/[messageId]/reactions -> add or replace own reaction
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthorized();

    const { messageId } =await params;
    const { emoji } = await request.json();
    if (!emoji) return badRequest('emoji is required');

    await connectDB();

    const message = await Message.findById(messageId).populate('chatId', 'participants');
    if (!message) return notFound('Message not found');

    const isParticipant = message.chatId.participants.some(p => p.toString() === session.user.id);
    if (!isParticipant) return forbidden('Not authorized');

    // Remove existing reaction by this user, then add new one
    message.reactions = (message.reactions || []).filter(r => r.by.toString() !== session.user.id);
    message.reactions.push({ emoji, by: session.user.id });
    await message.save();

    return ok(message);
  } catch (error) {
    console.error('Add reaction error:', error);
    return serverError();
  }
}

// DELETE /api/messages/[messageId]/reactions -> remove own reaction (optionally specific emoji)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthorized();

    const { messageId } =await params;
    const { emoji } = await request.json().catch(() => ({}));

    await connectDB();

    const message = await Message.findById(messageId).populate('chatId', 'participants');
    if (!message) return notFound('Message not found');

    const isParticipant = message.chatId.participants.some(p => p.toString() === session.user.id);
    if (!isParticipant) return forbidden('Not authorized');

    message.reactions = (message.reactions || []).filter(r => {
      const isByUser = r.by.toString() === session.user.id;
      if (!isByUser) return true;
      if (emoji) return r.emoji !== emoji;
      return false; // remove all by user
    });
    await message.save();

    return ok(message);
  } catch (error) {
    console.error('Remove reaction error:', error);
    return serverError();
  }
}


