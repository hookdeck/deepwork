import { NextRequest, NextResponse } from 'next/server';
import { researchStorage } from '@/lib/storage/research';

// Test endpoint to simulate the research workflow
export async function POST(request: NextRequest) {
  try {
    const { action, researchId, result } = await request.json();

    if (action === 'simulate-webhook') {
      // Simulate an OpenAI webhook response
      if (!researchId) {
        return NextResponse.json(
          { error: 'researchId is required' },
          { status: 400 }
        );
      }

      const research = await researchStorage.get(researchId);
      if (!research) {
        return NextResponse.json(
          { error: 'Research not found' },
          { status: 404 }
        );
      }

      // Simulate webhook processing
      const updated = await researchStorage.update(researchId, {
        status: 'completed',
        result: result || `This is a simulated response for: "${research.question}"`,
        openaiRequestId: `sim-${crypto.randomUUID()}`
      });

      return NextResponse.json({
        message: 'Webhook simulation successful',
        research: updated
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check the workflow status
export async function GET(request: NextRequest) {
  try {
    const researches = await researchStorage.list();
    
    return NextResponse.json({
      totalResearches: researches.length,
      byStatus: {
        pending: researches.filter(r => r.status === 'pending').length,
        processing: researches.filter(r => r.status === 'processing').length,
        completed: researches.filter(r => r.status === 'completed').length,
        failed: researches.filter(r => r.status === 'failed').length,
      },
      researches: researches.slice(0, 5) // Show last 5 researches
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}