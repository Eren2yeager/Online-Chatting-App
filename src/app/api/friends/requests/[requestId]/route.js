import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FriendRequest from '@/models/FriendRequest';
import User from '@/models/User';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = params;
    const body = await request.json();
    const { action } = body; // 'accept', 'reject', or 'cancel'

    if (!['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await dbConnect();

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Check if user has permission to modify this request
    if (action === 'cancel' && friendRequest.from.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Cannot cancel someone else\'s request' }, { status: 403 });
    }

    if (['accept', 'reject'].includes(action) && friendRequest.to.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Cannot accept/reject requests not sent to you' }, { status: 403 });
    }

    // If accepted, add each other as friends
    if (action === 'accept') {
      const [fromUser, toUser] = await Promise.all([
        User.findById(friendRequest.from),
        User.findById(friendRequest.to)
      ]);

      if (fromUser && toUser) {
        // Add to friends array if not already there
        if (!fromUser.friends.includes(friendRequest.to)) {
          fromUser.friends.push(friendRequest.to);
        }
        if (!toUser.friends.includes(friendRequest.from)) {
          toUser.friends.push(friendRequest.from);
        }
        await Promise.all([fromUser.save(), toUser.save()]);
      }
      // Delete the friend request after accepting
      await FriendRequest.findByIdAndDelete(requestId);
      return NextResponse.json({ message: 'Friend request accepted and deleted' });
    }

    // If cancelled, delete the friend request
    if (action === 'cancel') {
      await FriendRequest.findByIdAndDelete(requestId);
      return NextResponse.json({ message: 'Friend request cancelled and deleted' });
    }

    // If rejected, update status but do not delete
    if (action === 'reject') {
      friendRequest.status = 'rejected';
      await friendRequest.save();
      const updatedRequest = await FriendRequest.findById(requestId)
        .populate('from', 'name handle image')
        .populate('to', 'name handle image');
      return NextResponse.json(updatedRequest);
    }

    // Fallback (should not reach here)
    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });
  } catch (error) {
    console.error('Friend request PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = params;
    await dbConnect();
    
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Check if user has permission to delete this request
    if (friendRequest.from.toString() !== session.user.id && 
        friendRequest.to.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Cannot delete someone else\'s request' }, { status: 403 });
    }

    await FriendRequest.findByIdAndDelete(requestId);
    
    return NextResponse.json({ message: 'Friend request deleted successfully' });
  } catch (error) {
    console.error('Friend request DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
