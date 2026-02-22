import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import Call from "@/models/Call.mjs";

/**
 * GET /api/calls/missed
 * Get count of missed calls for the current user
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count missed calls
    const missedCount = await Call.countDocuments({
      "participants": {
        $elemMatch: {
          userId: session.user.id,
          status: { $in: ["missed", "ringing"] },
        },
      },
      status: { $in: ["ended", "cancelled"] },
      initiator: { $ne: session.user.id }, // Only incoming calls
    });

    return Response.json({
      success: true,
      count: missedCount,
    });
  } catch (error) {
    console.error("Error fetching missed calls count:", error);
    return Response.json(
      { error: "Failed to fetch missed calls count" },
      { status: 500 }
    );
  }
}
