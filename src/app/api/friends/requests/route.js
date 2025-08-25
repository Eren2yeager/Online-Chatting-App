import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import FriendRequest from '../../../../models/FriendRequest';
import { friendRequestCreateSchema } from '../../../../lib/validators';
import { rateLimit } from '../../../../lib/rateLimit';

/**
 * POST /api/friends/requests
 * Create a new friend request
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimit({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 friend requests per minute
    })(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    await connectDB();

    // Validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = await friendRequestCreateSchema.parseAsync(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { toHandle, toEmail, message } = validatedData;
    const fromUserId = session.user.id;

    // Find target user
    let targetUser;
    if (toHandle) {
      targetUser = await User.findOne({ handle: toHandle });
    } else if (toEmail) {
      targetUser = await User.findOne({ email: toEmail });
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent self-friend request
    if (targetUser._id.toString() === fromUserId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if already friends
    const fromUser = await User.findById(fromUserId);
    if (fromUser.friends.includes(targetUser._id)) {
      return NextResponse.json(
        { error: 'Already friends with this user' },
        { status: 400 }
      );
    }

    // Check if friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: fromUserId, to: targetUser._id },
        { from: targetUser._id, to: fromUserId }
      ]
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Friend request already exists' },
        { status: 400 }
      );
    }

    // Create friend request
    const friendRequest = await FriendRequest.create({
      from: fromUserId,
      to: targetUser._id,
      message: message || '',
    });

    // Populate user details
    await friendRequest.populate('from', 'name image handle');
    await friendRequest.populate('to', 'name image handle');

    return NextResponse.json({
      success: true,
      data: friendRequest,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/friends/requests
 * Get friend requests for the authenticated user
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received'; // 'received' or 'sent'

    let friendRequests;
    if (type === 'sent') {
      friendRequests = await FriendRequest.find({ from: userId })
        .populate('to', 'name image handle')
        .sort({ createdAt: -1 });
    } else {
      friendRequests = await FriendRequest.find({ to: userId })
        .populate('from', 'name image handle')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      data: friendRequests,
    });

  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
