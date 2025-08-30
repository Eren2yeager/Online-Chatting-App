import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import dbConnect from '@/lib/mongodb.js';
import FriendRequest from '@/models/FriendRequest.js';
import User from '@/models/User.js';
import { ok, created, badRequest, unauthorized, notFound, forbidden, serverError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await dbConnect();

    // Only return requests with status 'pending', and always return arrays (never undefined)
    const [incomingRequests, outgoingRequests] = await Promise.all([
      FriendRequest.find({ to: session.user.id, status: 'pending' })
        .populate('from', 'name handle image status lastSeen')
        .lean(),
      FriendRequest.find({ from: session.user.id, status: 'pending' })
        .populate('to', 'name handle image status lastSeen')
        .lean()
    ]);

    // Always return { success: true, incoming: [], outgoing: [] }
    return NextResponse.json({
      success: true,
      incoming: Array.isArray(incomingRequests) ? incomingRequests : [],
      outgoing: Array.isArray(outgoingRequests) ? outgoingRequests : []
    });
  } catch (error) {
    console.error('Friend requests GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const body = await request.json();
    const { handle, message } = body;
    if (!handle) return badRequest('Handle is required');

    await dbConnect();
    const targetUser = await User.findOne({ handle: handle.replace('@', '') });
    if (!targetUser) return notFound('User not found');
    if (targetUser._id.toString() === session.user.id) return badRequest('Cannot send friend request to yourself');

    if (targetUser.blocked.includes(session.user.id)) return forbidden('You are blocked by this user');
    const currentUser = await User.findById(session.user.id);
    if (currentUser.blocked.includes(targetUser._id)) return badRequest('Cannot send friend request to blocked user');
    if (currentUser.friends.includes(targetUser._id)) return badRequest('Already friends with this user');

    const existingPendingRequest = await FriendRequest.findOne({
      $or: [
        { from: session.user.id, to: targetUser._id, status: 'pending' },
        { from: targetUser._id, to: session.user.id, status: 'pending' }
      ]
    });
    if (existingPendingRequest) return badRequest('Friend request already exists');

    const friendRequest = await FriendRequest.create({
      from: session.user.id,
      to: targetUser._id,
      message: message || '',
      status: 'pending'
    });

    const populatedRequest = await FriendRequest.findById(friendRequest._id)
      .populate('from', 'name handle image')
      .populate('to', 'name handle image');

    return created(populatedRequest);
  } catch (error) {
    console.error('Friend request POST error:', error);
    return serverError();
  }
}
