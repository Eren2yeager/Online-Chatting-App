import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// PUT - Accept or reject friend request
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;
    const { action } = await request.json(); // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await connectDB();

    // Find the current user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the friend request
    const friendRequest = user.friendRequests.id(requestId);
    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    if (action === 'accept') {
      // Add both users to each other's friends list
      const senderId = friendRequest.sender;
      
      // Add sender to current user's friends
      if (!user.friends.includes(senderId)) {
        user.friends.push(senderId);
      }
      
      // Add current user to sender's friends
      const sender = await User.findById(senderId);
      if (sender && !sender.friends.includes(session.user.id)) {
        sender.friends.push(session.user.id);
        await sender.save();
      }

      // Update request status
      friendRequest.status = 'accepted';
    } else {
      // Update request status
      friendRequest.status = 'rejected';
    }

    await user.save();

    return NextResponse.json({ 
      message: `Friend request ${action}ed successfully` 
    });
  } catch (error) {
    console.error('Error handling friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
