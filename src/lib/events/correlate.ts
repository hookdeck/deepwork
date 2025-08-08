import { HookdeckEvent, EventTimeline } from "@/types/events";
import kv from "../storage/kv";
import { getHookdeckConnections } from "../hookdeck/initialize";

const HOOKDECK_API_URL = "https://api.hookdeck.com/2023-07-01";

/**
 * Fetches and correlates events from Hookdeck for a given research ID
 */
export async function getCorrelatedEvents(
  researchId: string,
  openaiRequestId: string | undefined
): Promise<EventTimeline[]> {
  const connections = await getHookdeckConnections();

  try {
    const outbound = await fetch(
      `${HOOKDECK_API_URL}/events?` +
        new URLSearchParams({
          search_term: researchId,
          order_by: "created_at",
          dir: "asc",
        }),
      {
        headers: {
          Authorization: `Bearer ${process.env.HOOKDECK_API_KEY}`,
        },
      }
    );

    if (!outbound.ok) {
      throw new Error(`Failed to fetch events: ${outbound.statusText}`);
    }

    let inbound = undefined;
    if (openaiRequestId) {
      inbound = await fetch(
        `${HOOKDECK_API_URL}/events?` +
          new URLSearchParams({
            search_term: openaiRequestId,
          }),
        {
          headers: {
            Authorization: `Bearer ${process.env.HOOKDECK_API_KEY}`,
          },
        }
      );

      if (!inbound.ok) {
        throw new Error(`Failed to fetch events: ${inbound.statusText}`);
      }
    }

    const outboundData = await outbound.json();
    const outboundEvents = outboundData.models || [];
    let inboundEvents = [];

    if (inbound) {
      const inboundData = await inbound.json();
      inboundEvents = inboundData.models || [];
    }

    // Combine and sort events by timestamp
    const events: HookdeckEvent[] = [...outboundEvents, ...inboundEvents].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (events.length === 0) {
      return [];
    }

    /* Event structure:
    {
      "id": "evt_5b3mzbxk83deakr",
      "team_id": "tm_5b3mzbxk83c0k7i",
      "webhook_id": "web_5b3mzbxk83dcij0",
      "source_id": "src_5b3mzbxk83dciin",
      "destination_id": "des_5b3mzbxk83dciim",
      "cli_id": null,
      "event_data_id": "evtreq_Ixux8vb2VBnZIuieVFPcUF9d",
      "attempts": 0,
      "status": "QUEUED",
      "response_status": null,
      "last_attempt_at": null,
      "next_attempt_at": null,
      "successful_at": null,
      "updated_at": "2020-03-22T18:24:01.031Z",
      "created_at": "2020-03-22T18:24:01.035Z"
    }
    */

    // Separate and correlate outbound/inbound
    const timeline: EventTimeline[] = events.map((event: any) => {
      return {
        id: event.id,
        type:
          event.source_id === connections?.webhook.sourceId
            ? "inbound"
            : "outbound",
        status: event.status,
        timestamp: event.created_at,
        data: event.data,
      };
    });

    return timeline;
  } catch (error) {
    console.error("Error fetching events from Hookdeck:", error);
    throw error;
  }
}
