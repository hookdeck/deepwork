import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/hookdeck/verify';
import { researchStorage } from '@/lib/storage/research';
import { OpenAIWebhookPayload } from '@/types/research';

// POST /api/webhooks/openai - Handle OpenAI webhook events
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const signature = request.headers.get('x-hookdeck-signature');
    const webhookId = request.headers.get('x-hookdeck-webhook-id');
    
    if (!signature || !webhookId) {
      console.error('Missing webhook headers');
      return NextResponse.json(
        { error: 'Missing webhook headers' },
        { status: 400 }
      );
    }

    // Verify the webhook
    const signingSecret = process.env.HOOKDECK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error('HOOKDECK_SIGNING_SECRET not configured');
      // In development, we might want to skip verification
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Webhook verification not configured' },
          { status: 500 }
        );
      }
    } else {
      const isValid = await verifyWebhookSignature(
        rawBody,
        signature,
        signingSecret
      );

      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    
    // Extract research ID from metadata or custom field
    // This would depend on how OpenAI sends back our metadata
    let researchId: string | undefined;
    
    // Try to get research ID from different possible locations
    if (payload.metadata?.researchId) {
      researchId = payload.metadata.researchId;
    } else if (payload.custom?.researchId) {
      researchId = payload.custom.researchId;
    } else if (payload.researchId) {
      researchId = payload.researchId;
    }

    if (!researchId) {
      console.error('No research ID found in webhook payload');
      return NextResponse.json(
        { error: 'No research ID in payload' },
        { status: 400 }
      );
    }

    // Process based on webhook type
    // For now, we'll assume it's a completion response
    if (payload.object === 'chat.completion' || payload.choices) {
      const openaiPayload = payload as OpenAIWebhookPayload;
      
      // Extract the response content
      const responseContent = openaiPayload.choices?.[0]?.message?.content || '';
      
      // Update research record
      const updated = await researchStorage.update(researchId, {
        status: 'completed',
        result: responseContent,
        openaiRequestId: openaiPayload.id
      });

      if (!updated) {
        console.error(`Research ${researchId} not found`);
        return NextResponse.json(
          { error: 'Research not found' },
          { status: 404 }
        );
      }

      console.log(`Research ${researchId} completed successfully`);
    } else if (payload.error) {
      // Handle error case
      await researchStorage.update(researchId, {
        status: 'failed',
        error: payload.error.message || 'Unknown error'
      });
      
      console.error(`Research ${researchId} failed:`, payload.error);
    }

    // Return success response
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook URL verification (if needed)
export async function GET(request: NextRequest) {
  // Some webhook providers send a GET request to verify the endpoint
  return NextResponse.json({ status: 'ok' });
}