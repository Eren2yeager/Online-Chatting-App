import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findById(session.user.id)
      .populate('friends', 'name handle image status lastSeen bio')
      .select('friends');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user.friends || [] });
  } catch (error) {
    console.error('Friends GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json({ success: false, error: 'Friend ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if already friends
    if (user.friends.includes(friendId)) {
      return NextResponse.json({ success: false, error: 'Already friends with this user' }, { status: 400 });
    }

    // Add to friends list
    user.friends.push(friendId);
    await user.save();

    // Return updated friends list
    const updatedUser = await User.findById(session.user.id)
      .populate('friends', 'name handle image status lastSeen bio')
      .select('friends');

    return NextResponse.json({ success: true, data: updatedUser.friends });
  } catch (error) {
    console.error('Friends POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
