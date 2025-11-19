import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import Notification from '@/models/Notification';

// DELETE - Permanently delete user account and all associated data
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // 1. Get all chats where user is a participant
    const userChats = await Chat.find({ participants: userId });

    // 2. Process each chat
    for (const chat of userChats) {
      if (chat.isGroup) {
        // For group chats, just remove the user
        await Chat.findByIdAndUpdate(chat._id, {
          $pull: { participants: userId, admins: userId }
        });
        
        // If chat now has 0 participants, delete it
        const updatedChat = await Chat.findById(chat._id);
        if (updatedChat && updatedChat.participants.length === 0) {
          await Chat.findByIdAndDelete(chat._id);
        }
      } else {
        // For direct chats (1-on-1), delete the entire chat
        await Chat.findByIdAndDelete(chat._id);
      }
    }

    // 3. Delete all messages from deleted chats and user's messages
    const deletedChatIds = userChats
      .filter(chat => !chat.isGroup)
      .map(chat => chat._id);
    
    // Delete all messages from deleted direct chats
    if (deletedChatIds.length > 0) {
      await Message.deleteMany({
        chatId: { $in: deletedChatIds }
      });
    }
    
    // Delete user's messages from group chats
    await Message.deleteMany({
      'sender._id': userId,
    });

    // 4. Delete all notifications for the user
    await Notification.deleteMany({
      recipient: userId,
    });

    // 5. Remove user from friends lists
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // 6. Remove user from blocked lists
    await User.updateMany(
      { blocked: userId },
      { $pull: { blocked: userId } }
    );

    // 7. Finally, delete the user account
    await User.findByIdAndDelete(userId);

    return Response.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
