import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET - Fetch friend requests for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get current user with friend requests
    const user = await User.findById(session.user.id)
      .populate('friendRequests.sender', 'id name image email')
      .select('friendRequests');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform friend requests
    const friendRequests = user.friendRequests.map(request => ({
      id: request._id.toString(),
      sender: {
        id: request.sender._id.toString(),
        name: request.sender.name,
        image: request.sender.image,
        email: request.sender.email
      },
      status: request.status,
      createdAt: request.createdAt
    }));

    return NextResponse.json(friendRequests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send friend request
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId } = await request.json();
    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
    }

    await connectDB();

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already friends or request already sent
    const sender = await User.findById(session.user.id);
    if (sender.friends.includes(recipientId)) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }

    const existingRequest = recipient.friendRequests.find(
      req => req.sender.toString() === session.user.id && req.status === 'pending'
    );
    if (existingRequest) {
      return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
    }

    // Add friend request to recipient
    recipient.friendRequests.push({
      sender: session.user.id,
      status: 'pending',
      createdAt: new Date()
    });
    await recipient.save();

    return NextResponse.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
