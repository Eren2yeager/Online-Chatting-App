import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// GET - Fetch user settings
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select('settings');
    
    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Return settings with defaults if not set
    const defaultSettings = {
      silentMode: false,
    };

    return Response.json({
      success: true,
      data: { ...defaultSettings, ...user.settings },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    await dbConnect();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { settings: body } },
      { new: true, runValidators: true }
    ).select('settings');

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: user.settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
