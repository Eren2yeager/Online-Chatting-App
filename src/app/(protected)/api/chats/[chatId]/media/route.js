import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import Message from '@/models/Message.js';

// GET /api/chats/[chatId]/media -> Get all media files shared in the group
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = params;

    await connectDB();

    // Check if user is a participant in the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return Response.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }

    const isParticipant = chat.participants.some(p => p.toString() === session.user.id);
    if (!isParticipant) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Find all messages with media in this chat
    const messages = await Message.find({
      chatId,
      type: { $in: ['image', 'video', 'audio', 'file'] },
      'media.0': { $exists: true },
      isDeleted: { $ne: true }
    })
    .populate('sender', 'name handle image')
    .sort({ createdAt: -1 })
    .limit(100);

    // Extract media from messages
    const media = [];
    messages.forEach(message => {
      if (message.media && Array.isArray(message.media)) {
        message.media.forEach(mediaItem => {
          media.push({
            ...mediaItem.toObject(),
            messageId: message._id,
            sender: message.sender,
            createdAt: message.createdAt
          });
        });
      }
    });

    return Response.json({ 
      success: true, 
      media,
      total: media.length
    });

  } catch (error) {
    console.error('Error fetching group media:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
