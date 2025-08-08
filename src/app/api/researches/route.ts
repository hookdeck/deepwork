import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { Research, CreateResearchRequest, ResearchListResponse } from '@/types/research';
import { researchStorage } from '@/lib/storage/research';
import { getHookdeckConnections, getSourceAuthCredentials } from '@/lib/hookdeck/initialize';

// POST /api/researches - Submit new research question
export async function POST(request: NextRequest) {
  console.log('Received request to create research');
  try {
    // Check authentication
    console.log('Checking authentication');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('Authentication successful');

    // Parse request body
    console.log('Parsing request body');
    const body: CreateResearchRequest = await request.json();
    if (!body.question || typeof body.question !== 'string') {
      console.log('Invalid request body');
      return NextResponse.json(
        { error: 'Invalid request: question is required' },
        { status: 400 }
      );
    }
    console.log('Request body parsed successfully');

    // Create research record
    console.log('Creating research record');
    const research: Research = {
      id: crypto.randomUUID(),
      question: body.question,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/openai`
    };
    console.log('Research record created:', research);

    // Save research record
    console.log('Saving research record');
    await researchStorage.save(research);
    console.log('Research record saved');

    // Send to Hookdeck queue
    const connections = await getHookdeckConnections();
    const auth = await getSourceAuthCredentials();

    if (!connections || !auth) {
      return NextResponse.json({ error: 'Hookdeck connections not initialized' }, { status: 500 });
    }

    const hookdeckUrl = connections.queue.sourceUrl;

    try {
      console.log('Sending to Hookdeck:', hookdeckUrl);
      // Prepare the payload for OpenAI
      const openaiPayload = {
        model: 'o4-mini-deep-research',
        input: body.question,
        tools: [
          { type: 'web_search_preview' },
        ],
        metadata: {
          researchId: research.id
        },
        background: true
      };

      // Send to Hookdeck queue with basic auth
      const hookdeckResponse = await fetch(hookdeckUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth.encoded}`
        },
        body: JSON.stringify(openaiPayload)
      });

      if (!hookdeckResponse.ok) {
        console.error('Failed to send to Hookdeck:', await hookdeckResponse.text());
      } else {
        console.log('Successfully sent to Hookdeck');
        // Update research with processing status
        await researchStorage.update(research.id, { status: 'processing' });
      }
    } catch (error) {
      console.error('Error sending to Hookdeck:', error);
    }

    // Return the created research
    return NextResponse.json(research, { status: 201 });

  } catch (error) {
    console.error('Error creating research:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/researches - List all research requests
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all researches
    const researches = await researchStorage.list();

    const response: ResearchListResponse = {
      researches
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error listing researches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}