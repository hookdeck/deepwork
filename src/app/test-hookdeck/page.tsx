'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface ConnectionInfo {
  queue: { id: string; sourceUrl: string };
  webhook: { id: string; sourceUrl: string };
}

export default function TestHookdeckPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    redirect('/login');
  }

  const testInitialization = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/hookdeck-init');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to initialize Hookdeck connections');
      }
    } catch (err) {
      setError('An error occurred while testing initialization');
    } finally {
      setLoading(false);
    }
  };

  const clearConnections = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/hookdeck-init', {
        method: 'DELETE'
      });
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to clear Hookdeck connections');
      }
    } catch (err) {
      setError('An error occurred while clearing connections');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Test Hookdeck Initialization</h1>
      
      <div className="bg-muted p-6 rounded-lg mb-8">
        <p className="mb-4">
          This page tests the Hookdeck initialization functionality. Click the button below to create or retrieve Hookdeck connections.
        </p>
        <div className="flex gap-4">
          <button
            onClick={testInitialization}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Testing...' : 'Test Initialization'}
          </button>
          <button
            onClick={clearConnections}
            disabled={loading}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {loading ? 'Clearing...' : 'Clear Connections'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-danger px-4 py-3 rounded mb-8">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-success px-4 py-3 rounded">
          <h2 className="text-xl font-semibold mb-4">Result:</h2>
          <pre className="bg-card p-4 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}