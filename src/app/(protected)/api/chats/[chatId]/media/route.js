import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import Message from '@/models/Message.js';

/**
 * GET /api/chats/[chatId]/media
 * Returns all media files shared in the specified chat.
 * 
 * This route:
 * - Authenticates the user using next-auth session.
 * - Ensures the user is a participant in the chat.
 * - Fetches up to 100 most recent messages in the chat that contain media (regardless of type).
 * - Excludes messages that are deleted for the session user or deleted for everyone.
 * - Extracts all media items from those messages, including metadata.
 * - Returns a flat array of media items, each annotated with messageId, sender, and createdAt.
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = params;

    // Ensure DB connection
    await connectDB();

    // Fetch the chat and check if it exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return Response.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }

    // Check if the requesting user is a participant in the chat
    const isParticipant = chat.participants.some(
      p => p.toString() === session.user.id
    );
    if (!isParticipant) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Find all messages in this chat that have at least one media item,
    // are not deleted for everyone, and are not deleted for the session user
    const messages = await Message.find({
      chatId,
      'media.0': { $exists: true },
      isDeleted: { $ne: true },
      deletedFor: { $ne: session.user.id }
    })
      .populate('sender', 'name handle image')
      .sort({ createdAt: -1 })
      .limit(100);

    // Extract all media items from the found messages
    const media = [];
    for (const message of messages) {
      if (Array.isArray(message.media)) {
        for (const mediaItem of message.media) {
          const mediaObj = typeof mediaItem.toObject === 'function'
            ? mediaItem.toObject()
            : { ...mediaItem };
          media.push({
            ...mediaObj,
            messageId: message._id,
            sender: message.sender,
            createdAt: message.createdAt
          });
        }
      }
    }

    return Response.json({
      success: true,
      media,
      total: media.length
    });

  } catch (error) {
    console.error('Error fetching chat media:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
