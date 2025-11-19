import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// POST - Block a user
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return Response.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (id === session.user.id) {
      return Response.json(
        { success: false, message: 'You cannot block yourself' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Add user to blocked list and remove from friends
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { 
        $addToSet: { blocked: id },
        $pull: { friends: id }
      },
      { new: true }
    );

    // Also remove current user from the blocked user's friends list
    await User.findByIdAndUpdate(
      id,
      { $pull: { friends: session.user.id } }
    );

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: 'User blocked successfully',
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
