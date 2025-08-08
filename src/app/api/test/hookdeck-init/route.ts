import { NextResponse } from 'next/server';
import { ensureHookdeckConnections, clearHookdeckConnections } from '../../../../lib/hookdeck/initialize';
import { ensureHookdeckConnectionsMock, clearHookdeckConnectionsMock } from '../../../../lib/hookdeck/initialize.mock';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock if Hookdeck API key is not configured or mock mode is enabled
    const hookdeckApiKey = process.env.HOOKDECK_API_KEY;
    const useMock = !hookdeckApiKey || process.env.USE_MOCK_HOOKDECK === 'true';
    
    // Try to initialize Hookdeck connections
    const connections = useMock 
      ? await ensureHookdeckConnectionsMock()
      : await ensureHookdeckConnections();

    return NextResponse.json({
      success: true,
      message: `Hookdeck connections initialized successfully${useMock ? ' (mock mode)' : ''}`,
      mockMode: useMock,
      connections: {
        queue: {
          id: connections.queue.id,
          sourceUrl: connections.queue.sourceUrl
        },
        webhook: {
          id: connections.webhook.id,
          sourceUrl: connections.webhook.sourceUrl
        }
      }
    });
  } catch (error) {
    console.error('Error initializing Hookdeck connections:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE endpoint for testing - clears the connections
export async function DELETE() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock if Hookdeck API key is not configured or mock mode is enabled
    const hookdeckApiKey = process.env.HOOKDECK_API_KEY;
    const useMock = !hookdeckApiKey || process.env.USE_MOCK_HOOKDECK === 'true';
    
    // Clear the connections
    if (useMock) {
      await clearHookdeckConnectionsMock();
    } else {
      await clearHookdeckConnections();
    }

    return NextResponse.json({
      success: true,
      message: `Hookdeck connections cleared successfully${useMock ? ' (mock mode)' : ''}`,
      mockMode: useMock
    });
  } catch (error) {
    console.error('Error clearing Hookdeck connections:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}