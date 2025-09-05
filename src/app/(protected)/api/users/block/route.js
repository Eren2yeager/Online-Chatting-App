import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import dbConnect from '@/lib/mongodb.js';
import User from '@/models/User.js';

// GET: Get all blocked users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id)
      .populate('blocked', 'name handle image status lastSeen bio')
      .select('blocked');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user.blocked || [] });
  } catch (error) {
    console.error('Blocked GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Block a user
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    await dbConnect();
    const me = await User.findById(session.user.id);
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Remove from friends if present
    me.friends = me.friends.filter((id) => id.toString() !== userId);
    // Add to blocked if not already
    if (!me.blocked.some((id) => id.toString() === userId)) {
      me.blocked.push(userId);
    }
    await me.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Unblock a user
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    await dbConnect();
    const me = await User.findById(session.user.id);
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    me.blocked = me.blocked.filter((id) => id.toString() !== userId);
    await me.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
