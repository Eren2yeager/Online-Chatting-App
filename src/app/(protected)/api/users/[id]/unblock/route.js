import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// POST - Unblock a user
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

    await dbConnect();

    // Remove user from blocked list
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $pull: { blocked: id } },
      { new: true }
    );

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
