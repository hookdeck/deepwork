import { HookdeckEvent, EventTimeline } from '@/types/events';

const HOOKDECK_API_URL = 'https://api.hookdeck.com/2023-07-01';

/**
 * Fetches and correlates events from Hookdeck for a given research ID
 */
export async function getCorrelatedEvents(researchId: string): Promise<EventTimeline[]> {
  // If no API key is configured, return mock data for testing
  if (!process.env.HOOKDECK_API_KEY || process.env.HOOKDECK_API_KEY === 'test-key') {
    return getMockEvents(researchId);
  }

  try {
    const response = await fetch(
      `${HOOKDECK_API_URL}/events?` + new URLSearchParams({
        'body_json.research_id': researchId,
        'order_by': 'created_at',
        'dir': 'asc'
      }),
      {
        headers: {
          'Authorization': `Bearer ${process.env.HOOKDECK_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    const events = data.models || [];

    // Separate and correlate outbound/inbound
    const timeline: EventTimeline[] = events
      .sort((a: HookdeckEvent, b: HookdeckEvent) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((event: HookdeckEvent) => ({
        id: event.id,
        type: event.source.name === 'deepqueue-source' ? 'outbound' : 'inbound',
        connection: event.connection.name,
        status: event.status,
        timestamp: event.created_at,
        data: event.data
      }));

    return timeline;
  } catch (error) {
    console.error('Error fetching events from Hookdeck:', error);
    throw error;
  }
}

/**
 * Returns mock events for testing purposes
 */
function getMockEvents(researchId: string): EventTimeline[] {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);

  return [
    {
      id: 'evt_mock_1',
      type: 'outbound',
      connection: 'openai-queue',
      status: 'SUCCESS',
      timestamp: fiveMinutesAgo.toISOString(),
      data: {
        research_id: researchId,
        question: 'Sample research question',
        sent_to: 'OpenAI Deep Research'
      }
    },
    {
      id: 'evt_mock_2',
      type: 'inbound',
      connection: 'openai-webhook',
      status: 'SUCCESS',
      timestamp: threeMinutesAgo.toISOString(),
      data: {
        research_id: researchId,
        status: 'processing',
        progress: 50
      }
    }
  ];
}