import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import User from '@/models/User.mjs';

// GET /api/users - Get all users (for adding friends)
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users except current user
    const users = await User.find({ _id: { $ne: session.user.id } })
      .select('name email image handle bio status lastSeen')
      .limit(50);

    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      handle: user.handle,
      bio: user.bio,
      status: user.status,
      lastSeen: user.lastSeen
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create or update user profile
export async function POST(request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, image } = await request.json();

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { name, image },
      { new: true, runValidators: true }
    ).select('name email image handle bio status lastSeen');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      handle: updatedUser.handle,
      bio: updatedUser.bio,
      status: updatedUser.status,
      lastSeen: updatedUser.lastSeen
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
