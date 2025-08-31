import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import Chat from '@/models/Chat.js';
import Message from '@/models/Message.js';

// GET /api/chats/[chatId]/links -> Get all links shared in the group
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

    // Find all messages with links in this chat
    const messages = await Message.find({
      chatId,
      type: 'text',
      text: { $regex: /https?:\/\/[^\s]+/ },
      isDeleted: { $ne: true }
    })
    .populate('sender', 'name handle image')
    .sort({ createdAt: -1 })
    .limit(100);

    // Extract links from messages
    const links = [];
    const urlRegex = /https?:\/\/[^\s]+/g;
    
    messages.forEach(message => {
      const urls = message.text.match(urlRegex);
      if (urls) {
        urls.forEach(url => {
          links.push({
            url,
            messageId: message._id,
            sender: message.sender,
            sharedBy: message.sender,
            createdAt: message.createdAt,
            title: extractDomain(url),
            description: message.text.replace(urlRegex, '').trim().substring(0, 100)
          });
        });
      }
    });

    return Response.json({ 
      success: true, 
      links,
      total: links.length
    });

  } catch (error) {
    console.error('Error fetching group links:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

function extractDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Link';
  }
}
