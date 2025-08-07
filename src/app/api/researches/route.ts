import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { Research, CreateResearchRequest, ResearchListResponse } from '@/types/research';
import { researchStorage } from '@/lib/storage/research';

// POST /api/researches - Submit new research question
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateResearchRequest = await request.json();
    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: question is required' },
        { status: 400 }
      );
    }

    // Create research record
    const research: Research = {
      id: crypto.randomUUID(),
      question: body.question,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/openai`
    };

    // Save research record
    await researchStorage.save(research);

    // Send to Hookdeck queue
    const hookdeckUrl = process.env.HOOKDECK_OPENAI_QUEUE_URL;
    if (!hookdeckUrl) {
      console.error('HOOKDECK_OPENAI_QUEUE_URL not configured');
      // For development, we'll continue without sending to Hookdeck
    } else {
      try {
        // Prepare the payload for OpenAI (mocked for now)
        const openaiPayload = {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful research assistant.'
            },
            {
              role: 'user',
              content: body.question
            }
          ],
          metadata: {
            researchId: research.id,
            webhookUrl: research.webhookUrl
          }
        };

        // Send to Hookdeck queue with basic auth
        const hookdeckResponse = await fetch(hookdeckUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${process.env.HOOKDECK_API_KEY}:`).toString('base64')}`
          },
          body: JSON.stringify(openaiPayload)
        });

        if (!hookdeckResponse.ok) {
          console.error('Failed to send to Hookdeck:', await hookdeckResponse.text());
        } else {
          // Update research with processing status
          await researchStorage.update(research.id, { status: 'processing' });
        }
      } catch (error) {
        console.error('Error sending to Hookdeck:', error);
      }
    }

    // Return the created research
    return NextResponse.json(research, { status: 201 });

  } catch (error) {
    console.error('Error creating research:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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