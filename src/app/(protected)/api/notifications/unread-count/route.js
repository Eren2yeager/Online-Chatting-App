import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the current user
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const unreadCount = await Notification.countDocuments({
      to: session.user.id,
      read: false,
    });

    return NextResponse.json({
      success: true,
      count: unreadCount,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get unread count" },
      { status: 500 }
    );
  }
}
