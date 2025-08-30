import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import Message from '@/models/Message.js';
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/api-helpers.js';

// POST /api/chats/[chatId]/read -> mark all messages up to optional messageId as read
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthorized();

    const { chatId } =await params;
    const { upToMessageId } = await request.json().catch(() => ({}));

    await connectDB();

    const chat = await Chat.findById(chatId);
    if (!chat) return notFound('Chat not found');

    const isParticipant = chat.participants.some(p => p.toString() === session.user.id);
    if (!isParticipant) return forbidden('Not a participant');

    const filter = { chatId };
    if (upToMessageId) {
      const upTo = await Message.findById(upToMessageId);
      if (upTo) filter.createdAt = { $lte: upTo.createdAt };
    }

    await Message.updateMany(filter, { $addToSet: { readBy: session.user.id } });

    await Chat.findByIdAndUpdate(chatId, { $pull: { unreadCounts: { user: session.user.id } } });

    return ok({ chatId, upToMessageId: upToMessageId || null });
  } catch (error) {
    console.error('Mark chat read error:', error);
    return serverError();
  }
}


