import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import FriendRequest from '@/models/FriendRequest.js';
import { rateLimit } from '@/lib/rateLimit.js';

/**
 * GET /api/friends/requests/count
 * Get the count of pending friend requests for the current user
 */
export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 100, 60 * 1000); // 100 requests per minute
    if (!rateLimitResult.success) {
      return Response.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Count pending friend requests received by the current user
    const count = await FriendRequest.countDocuments({
      to: session.user.id,
      status: 'pending'
    });

    return Response.json({
      success: true,
      count: count
    });

  } catch (error) {
    console.error('Error fetching friend requests count:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
