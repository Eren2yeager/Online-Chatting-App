import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET - Check if current user can call the target user
 * Returns false if either user has blocked the other
 */
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ success: false, canCall: false }, { status: 401 });
    }

    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return Response.json({ success: false, canCall: false }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return Response.json({ success: true, canCall: false, reason: 'self' });
    }

    await dbConnect();

    const [caller, target] = await Promise.all([
      User.findById(session.user.id).select('blocked').lean(),
      User.findById(targetUserId).select('blocked').lean(),
    ]);

    if (!caller || !target) {
      return Response.json({ success: true, canCall: false, reason: 'user_not_found' });
    }

    const callerBlocked = (caller.blocked || []).some((b) => String(b) === targetUserId);
    const targetBlockedCaller = (target.blocked || []).some((b) => String(b) === session.user.id);

    if (callerBlocked) {
      return Response.json({ success: true, canCall: false, reason: 'you_blocked' });
    }
    if (targetBlockedCaller) {
      return Response.json({ success: true, canCall: false, reason: 'blocked_you' });
    }

    return Response.json({ success: true, canCall: true });
  } catch (error) {
    console.error('Error checking can-call:', error);
    return Response.json({ success: false, canCall: false }, { status: 500 });
  }
}
