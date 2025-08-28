import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FriendRequest from '@/models/FriendRequest';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all friend requests involving the user, both incoming and outgoing, regardless of status
    const [incomingRequests, outgoingRequests] = await Promise.all([
      FriendRequest.find({ 
        to: session.user.id
      }).populate('from', 'name handle image status lastSeen'),
      FriendRequest.find({ 
        from: session.user.id
      }).populate('to', 'name handle image status lastSeen')
    ]);

    // Return separate arrays for incoming and outgoing, including all statuses
    return NextResponse.json({
      incoming: incomingRequests,
      outgoing: outgoingRequests
    });
  } catch (error) {
    console.error('Friend requests GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { handle, message } = body;

    if (!handle) {
      return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Find the target user by handle
    const targetUser = await User.findOne({ handle: handle.replace('@', '') });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser._id.toString() === session.user.id) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    // Check if current user is blocked by target
    if (targetUser.blocked.includes(session.user.id)) {
      return NextResponse.json({ error: 'You are blocked by this user' }, { status: 403 });
    }

    // Check if target user is blocked by current user
    const currentUser = await User.findById(session.user.id);
    if (currentUser.blocked.includes(targetUser._id)) {
      return NextResponse.json({ error: 'Cannot send friend request to blocked user' }, { status: 400 });
    }

    // Check if they're already friends
    if (currentUser.friends.includes(targetUser._id)) {
      return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 });
    }

    // Check if there's already a pending request
    const existingPendingRequest = await FriendRequest.findOne({
      $or: [
        { from: session.user.id, to: targetUser._id, status: 'pending' },
        { from: targetUser._id, to: session.user.id, status: 'pending' }
      ]
    });

    if (existingPendingRequest) {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
    }

    // Create new friend request
    const friendRequest = new FriendRequest({
      from: session.user.id,
      to: targetUser._id,
      message: message || '',
      status: 'pending'
    });

    await friendRequest.save();

    // Populate the request for response
    const populatedRequest = await FriendRequest.findById(friendRequest._id)
      .populate('from', 'name handle image')
      .populate('to', 'name handle image');

    return NextResponse.json(populatedRequest, { status: 201 });
  } catch (error) {
    console.error('Friend request POST error:', error);
    if (error.message === 'Friend request already exists between these users') {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
