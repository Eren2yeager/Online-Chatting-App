import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET - Get friend request count for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get current user and count pending friend requests
    const user = await User.findById(session.user.id)
      .select('friendRequests');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const pendingCount = user.friendRequests.filter(
      request => request.status === 'pending'
    ).length;

    return NextResponse.json({ count: pendingCount });
  } catch (error) {
    console.error('Error fetching friend request count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
