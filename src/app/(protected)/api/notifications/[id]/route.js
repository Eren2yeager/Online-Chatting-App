import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification.mjs";

/**
 * PATCH /api/notifications/[id]
 * Mark a notification as read
 */
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;

    // Find and update notification
    const notification = await Notification.findOneAndUpdate(
      { _id: id, to: session.user.id },
      { read: true },
      { new: true }
    ).populate("fromUser", "name image handle");

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      to: session.user.id,
      read: false,
    });

    return NextResponse.json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;

    // Find and delete notification
    const notification = await Notification.findOneAndDelete({
      _id: id,
      to: session.user.id,
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      to: session.user.id,
      read: false,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
