import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth.js';
import dbConnect from '@/lib/mongodb.js';
import Chat from "@/models/Chat.mjs";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { chatId } = await params;

    const chat = await Chat.findById(chatId)
      .select("name description image privacy participants admins isGroup createdAt")
      .lean();

    if (!chat) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!chat.isGroup) {
      return NextResponse.json(
        { error: "This is not a group chat" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const isMember = chat.participants.some(
      (p) => p.toString() === session.user.id
    );

    // Return limited info for invite page
    return NextResponse.json({
      success: true,
      chat: {
        _id: chat._id,
        name: chat.name,
        description: chat.description,
        image: chat.image,
        privacy: chat.privacy,
        participants: chat.participants,
        admins: chat.admins,
        createdAt: chat.createdAt,
      },
      isMember,
    });
  } catch (error) {
    console.error("Error fetching invite info:", error);
    return NextResponse.json(
      { error: "Failed to fetch group details" },
      { status: 500 }
    );
  }
}
