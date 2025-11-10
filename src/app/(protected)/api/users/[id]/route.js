import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import connectDB from '@/lib/mongodb.js';
import User from '@/models/User.mjs';
import { userUpdateSchema } from '@/lib/validators.js';

/**
 * GET /api/users/[id]
 * Get user profile by ID or handle
 */
export async function GET(request, { params }) {
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

    const { id } = params;
    const currentUserId = session.user.id;

    // Find user by ID or handle
    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId format
      user = await User.findById(id);
    } else {
      // Handle format
      user = await User.findOne({ handle: id });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current user is friends with the requested user
    const currentUser = await User.findById(currentUserId);
    const isFriend = currentUser.friends.includes(user._id);
    const isOwnProfile = currentUserId === user._id.toString();

    // Return different data based on relationship
    const userData = {
      _id: user._id,
      name: user.name,
      handle: user.handle,
      image: user.image,

      status: user.status,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    };

    // Add additional fields for friends or own profile
    if (isFriend || isOwnProfile) {
      userData.bio = user.bio;
      userData.email = user.email;
      userData.emailVerified = user.emailVerified;
    }

    // Add friendship status
    userData.isFriend = isFriend;
    userData.isOwnProfile = isOwnProfile;

    return NextResponse.json({
      success: true,
      data: userData,
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update user profile
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

    const { id } = params;
    const currentUserId = session.user.id;

    // Users can only update their own profile
    if (id !== currentUserId) {
      return NextResponse.json(
        { error: 'Not authorized to update this profile' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = await userUpdateSchema.parseAsync(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findById(currentUserId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedFields = ['name', 'bio', 'status', 'image'];
    for (const field of allowedFields) {
      if (validatedData[field] !== undefined) {
        user[field] = validatedData[field];
      }
    }

    // Update lastSeen if status is being updated
    if (validatedData.status) {
      user.lastSeen = new Date();
    }

    await user.save();

    // Return updated user data
    const userData = {
      _id: user._id,
      name: user.name,
      handle: user.handle,
      image: user.image,

      bio: user.bio,
      status: user.status,
      lastSeen: user.lastSeen,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      isOwnProfile: true,
      isFriend: false,
    };

    return NextResponse.json({
      success: true,
      data: userData,
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
