import { getHookdeckConnections, getSourceAuthCredentials, ensureHookdeckConnections } from './initialize';

/**
 * Test utility for verifying Hookdeck connection setup
 */
export async function testHookdeckSetup() {
  const results = {
    apiKeyConfigured: false,
    connectionsExist: false,
    authConfigured: false,
    mockMode: false,
    errors: [] as string[],
    warnings: [] as string[]
  };

  try {
    // Check API key
    const apiKey = process.env.HOOKDECK_API_KEY;
    if (!apiKey) {
      results.errors.push('HOOKDECK_API_KEY not set');
    } else {
      results.apiKeyConfigured = true;
      // Mock mode is determined by USE_MOCK_HOOKDECK env var, not API key prefix
      if (process.env.USE_MOCK_HOOKDECK === 'true') {
        results.mockMode = true;
        results.warnings.push('Mock mode enabled - real API calls will be bypassed');
      }
    }

    // Check existing connections
    const connections = await getHookdeckConnections();
    if (connections) {
      results.connectionsExist = true;
    }

    // Check auth credentials
    const auth = await getSourceAuthCredentials();
    if (auth) {
      results.authConfigured = true;
    }

    // Test connection creation if needed
    if (!connections && !results.mockMode) {
      try {
        await ensureHookdeckConnections();
        results.connectionsExist = true;
      } catch (error) {
        results.errors.push(`Failed to create connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

  } catch (error) {
    results.errors.push(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
}

/**
 * Validates webhook payload structure
 */
export function validateWebhookPayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for research ID
  const researchId = payload.metadata?.researchId || payload.custom?.researchId || payload.researchId;
  if (!researchId) {
    errors.push('No research ID found in payload');
  }

  // Check for OpenAI response structure
  if (payload.object === 'chat.completion' || payload.choices) {
    if (!payload.choices || !Array.isArray(payload.choices)) {
      errors.push('Invalid choices array in payload');
    } else if (payload.choices.length === 0) {
      errors.push('No choices in response');
    } else if (!payload.choices[0].message?.content) {
      errors.push('No content in first choice');
    }
  } else if (!payload.error) {
    errors.push('Unknown payload type - expected chat.completion or error');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generates a test webhook payload
 */
export function generateTestWebhookPayload(researchId: string, content?: string): any {
  return {
    id: `test-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4',
    metadata: {
      researchId
    },
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: content || 'This is a test research result generated for testing purposes.'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150
    }
  };
}

/**
 * Tests the complete workflow
 */
export async function testCompleteWorkflow(userId: string) {
  const results = {
    steps: [] as { step: string; success: boolean; details?: any }[],
    success: true
  };

  try {
    // Step 1: Create research
    const createResponse = await fetch('/api/researches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Test workflow research',
        userId
      })
    });

    const research = await createResponse.json();
    results.steps.push({
      step: 'Create research',
      success: createResponse.ok,
      details: research
    });

    if (!createResponse.ok) {
      results.success = false;
      return results;
    }

    // Step 2: Check research status
    const statusResponse = await fetch(`/api/researches/${research.id}`);
    const statusData = await statusResponse.json();
    results.steps.push({
      step: 'Check research status',
      success: statusResponse.ok && statusData.status === 'pending',
      details: statusData
    });

    // Step 3: Simulate webhook
    const webhookPayload = generateTestWebhookPayload(research.id);
    const webhookResponse = await fetch('/api/webhooks/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hookdeck-signature': 'test-signature',
        'x-hookdeck-webhook-id': 'test-webhook-id'
      },
      body: JSON.stringify(webhookPayload)
    });

    results.steps.push({
      step: 'Process webhook',
      success: webhookResponse.ok,
      details: await webhookResponse.json()
    });

    // Step 4: Verify update
    const finalResponse = await fetch(`/api/researches/${research.id}`);
    const finalData = await finalResponse.json();
    results.steps.push({
      step: 'Verify research completed',
      success: finalResponse.ok && finalData.status === 'completed',
      details: finalData
    });

    results.success = results.steps.every(step => step.success);

  } catch (error) {
    results.success = false;
    results.steps.push({
      step: 'Error',
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}