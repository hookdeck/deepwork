import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { testHookdeckSetup, testCompleteWorkflow } from '@/lib/hookdeck/test-utils';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test Hookdeck setup
    const setupResults = await testHookdeckSetup();
    
    // Test complete workflow if setup is valid
    let workflowResults = null;
    if (setupResults.apiKeyConfigured && !setupResults.errors.length) {
      workflowResults = await testCompleteWorkflow(session.user.id || 'test-user');
    }

    // Compile comprehensive test results
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasHookdeckKey: !!process.env.HOOKDECK_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasSigningSecret: !!process.env.HOOKDECK_SIGNING_SECRET,
        debugMode: process.env.DEBUG === 'true'
      },
      setup: setupResults,
      workflow: workflowResults,
      recommendations: [] as string[]
    };

    // Add recommendations based on results
    if (!setupResults.apiKeyConfigured) {
      results.recommendations.push('Configure HOOKDECK_API_KEY in your .env.local file');
    }
    if (setupResults.mockMode) {
      results.recommendations.push('Using mock mode - get a production API key for real testing');
    }
    if (!results.environment.hasOpenAIKey) {
      results.recommendations.push('Configure OPENAI_API_KEY for complete integration testing');
    }
    if (!results.environment.hasSigningSecret) {
      results.recommendations.push('Configure HOOKDECK_SIGNING_SECRET for webhook verification');
    }
    if (workflowResults && !workflowResults.success) {
      results.recommendations.push('Fix workflow issues before proceeding with deployment');
    }

    const overallSuccess = setupResults.errors.length === 0 && 
                          (!workflowResults || workflowResults.success);

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'All tests passed! Ready for deployment.' 
        : 'Some tests failed. See details below.',
      results
    });

  } catch (error) {
    console.error('Error running complete workflow test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}