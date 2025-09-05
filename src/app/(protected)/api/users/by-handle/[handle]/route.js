import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { handle } =await  params;
    
    if (!handle) {
      return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Find user by handle, excluding sensitive information
    const user = await User.findOne({ handle: handle.replace('@', '') })
      .select('name handle image bio status lastSeen friends createdAt')
      .populate('friends', 'name handle image');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // // Don't allow users to view their own profile through this endpoint
    // if (user._id.toString() === session.user.id) {
    //   return NextResponse.json({ error: 'Cannot view your own profile through invite link' }, { status: 400 });
    // }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User by handle GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
