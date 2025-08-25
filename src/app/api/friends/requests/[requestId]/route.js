import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import connectDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import FriendRequest from '../../../../../models/FriendRequest';
import { friendRequestUpdateSchema } from '../../../../../lib/validators';

/**
 * PATCH /api/friends/requests/[requestId]
 * Update friend request status (accept/reject/cancel)
 */
export async function PATCH(request, { params }) {
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

    const { requestId } = params;
    const userId = session.user.id;

    // Validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = await friendRequestUpdateSchema.parseAsync(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { status } = validatedData;

    // Find friend request
    const friendRequest = await FriendRequest.findById(requestId)
      .populate('from', 'name image handle')
      .populate('to', 'name image handle');

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Check authorization - user must be the recipient or sender
    const isRecipient = friendRequest.to._id.toString() === userId;
    const isSender = friendRequest.from._id.toString() === userId;

    if (!isRecipient && !isSender) {
      return NextResponse.json(
        { error: 'Not authorized to modify this friend request' },
        { status: 403 }
      );
    }

    // Validate status changes
    if (status === 'accepted' && !isRecipient) {
      return NextResponse.json(
        { error: 'Only the recipient can accept a friend request' },
        { status: 403 }
      );
    }

    if (status === 'cancelled' && !isSender) {
      return NextResponse.json(
        { error: 'Only the sender can cancel a friend request' },
        { status: 403 }
      );
    }

    // Update friend request status
    friendRequest.status = status;
    await friendRequest.save();

    // If accepted, add users to each other's friends list
    if (status === 'accepted') {
      const fromUser = await User.findById(friendRequest.from._id);
      const toUser = await User.findById(friendRequest.to._id);

      if (!fromUser.friends.includes(friendRequest.to._id)) {
        fromUser.friends.push(friendRequest.to._id);
        await fromUser.save();
      }

      if (!toUser.friends.includes(friendRequest.from._id)) {
        toUser.friends.push(friendRequest.from._id);
        await toUser.save();
      }
    }

    return NextResponse.json({
      success: true,
      data: friendRequest,
    });

  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/friends/requests/[requestId]
 * Delete a friend request
 */
export async function DELETE(request, { params }) {
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

    const { requestId } = params;
    const userId = session.user.id;

    // Find friend request
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Check authorization - user must be the recipient or sender
    const isRecipient = friendRequest.to.toString() === userId;
    const isSender = friendRequest.from.toString() === userId;

    if (!isRecipient && !isSender) {
      return NextResponse.json(
        { error: 'Not authorized to delete this friend request' },
        { status: 403 }
      );
    }

    // Delete friend request
    await FriendRequest.findByIdAndDelete(requestId);

    return NextResponse.json({
      success: true,
      message: 'Friend request deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
