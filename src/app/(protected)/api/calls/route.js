import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import Call from "@/models/Call.mjs";

/**
 * GET /api/calls
 * Get call history for the current user
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status"); // 'missed', 'ended', etc.

    // Build query
    const query = {
      "participants.userId": session.user.id,
    };

    if (status) {
      if (status === "missed") {
        // Missed calls: user was invited but never joined
        query["participants"] = {
          $elemMatch: {
            userId: session.user.id,
            status: { $in: ["missed", "ringing"] },
          },
        };
        query.status = { $in: ["ended", "cancelled"] };
      } else {
        query.status = status;
      }
    }

    const calls = await Call.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("initiator", "name image handle")
      .populate("participants.userId", "name image handle")
      .lean();

    // Add metadata for each call
    const callsWithMetadata = calls.map((call) => {
      const userParticipant = call.participants.find(
        (p) => p.userId._id.toString() === session.user.id
      );

      return {
        ...call,
        isMissed:
          userParticipant &&
          ["missed", "ringing"].includes(userParticipant.status) &&
          ["ended", "cancelled"].includes(call.status),
        isIncoming: call.initiator._id.toString() !== session.user.id,
        userStatus: userParticipant?.status,
      };
    });

    return Response.json({
      success: true,
      calls: callsWithMetadata,
    });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return Response.json(
      { error: "Failed to fetch call history" },
      { status: 500 }
    );
  }
}
