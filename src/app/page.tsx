'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Deep Queue</h1>
        <p className="text-lg text-gray-600 mb-8">
          AI-powered research with Hookdeck queuing
        </p>
        
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-3">Research Workflow</h2>
            <p className="text-muted mb-4">
              Submit research questions and get AI-powered responses through our 
              reliable queuing system.
            </p>
            {session ? (
              <Link 
                href="/test-research" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Try Research Workflow →
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Sign in to access</p>
            )}
          </div>
          
          <div className="p-6 border rounded-lg bg-card border-muted">
            <h2 className="text-2xl font-semibold mb-3">Hookdeck Integration</h2>
            <p className="text-muted mb-4">
              Leverages Hookdeck for reliable webhook processing and request queuing.
            </p>
            {session ? (
              <Link 
                href="/test-hookdeck" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Test Hookdeck Setup →
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Sign in to access</p>
            )}
          </div>
        </div>

        <div className="bg-muted rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted">
            <li>Submit a research question through the web interface</li>
            <li>The question is queued in Hookdeck for processing</li>
            <li>OpenAI deep research processes the request asynchronously</li>
            <li>Results are delivered back via webhooks</li>
            <li>The UI updates with the research results</li>
          </ol>
        </div>

        {!session && (
          <div className="mt-8 text-center">
            <Link 
              href="/login" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sign In to Get Started
            </Link>
          </div>
        )}
    </div>
  );
}
