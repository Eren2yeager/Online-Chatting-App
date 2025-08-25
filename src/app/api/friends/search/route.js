import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { userSearchSchema } from '../../../../lib/validators';

/**
 * GET /api/friends/search
 * Search for users by handle or email
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

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    let validatedData;
    try {
      validatedData = await userSearchSchema.parseAsync(query);
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { query: searchQuery, type } = validatedData;
    const currentUserId = session.user.id;

    // Build search query
    let searchCriteria = {};
    if (type === 'handle') {
      searchCriteria.handle = { $regex: searchQuery, $options: 'i' };
    } else if (type === 'email') {
      searchCriteria.email = { $regex: searchQuery, $options: 'i' };
    } else {
      // Search both handle and email
      searchCriteria = {
        $or: [
          { handle: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }

    // Exclude current user from search results
    searchCriteria._id = { $ne: currentUserId };

    // Find users
    const users = await User.find(searchCriteria)
      .select('name handle image avatar status lastSeen')
      .limit(10)
      .sort({ name: 1 });

    // Get current user's friends and friend requests
    const currentUser = await User.findById(currentUserId)
      .populate('friends', '_id')
      .populate({
        path: 'friendRequests',
        match: { status: 'pending' },
        populate: { path: 'from to', select: '_id' }
      });

    // Add relationship status to search results
    const results = users.map(user => {
      const isFriend = currentUser.friends.some(friend => 
        friend._id.toString() === user._id.toString()
      );

      const hasPendingRequest = currentUser.friendRequests.some(request => 
        (request.from._id.toString() === user._id.toString() && request.status === 'pending') ||
        (request.to._id.toString() === user._id.toString() && request.status === 'pending')
      );

      return {
        _id: user._id,
        name: user.name,
        handle: user.handle,
        image: user.image,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        isFriend,
        hasPendingRequest,
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
