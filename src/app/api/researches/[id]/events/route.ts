import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { getCorrelatedEvents } from "@/lib/events/correlate";
import { researchStorage } from "@/lib/storage/research";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const researchId = params.id;

    // Verify the research exists
    const research = await researchStorage.get(researchId);

    console.log("Fetching events for research:", researchId);
    console.log("Research found:", !!research);

    if (!research) {
      return NextResponse.json(
        { error: "Research not found", researchId },
        { status: 404 }
      );
    }

    // Get correlated events from Hookdeck
    const events = await getCorrelatedEvents(
      researchId,
      research.openaiRequestId
    );

    return NextResponse.json({
      researchId,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
