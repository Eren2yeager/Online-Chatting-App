import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb.js';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findById(session.user.id)
      .select('-__v')
      .populate('friends', 'name handle image status lastSeen')
      .populate('blocked', 'name handle image');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, image } = body;

    await dbConnect();
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (image !== undefined) user.image = image;

    await user.save();

    // Return updated user with populated fields
    const updatedUser = await User.findById(session.user.id)
      .select('-__v')
      .populate('friends', 'name handle image status lastSeen')
      .populate('blocked', 'name handle image');

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
