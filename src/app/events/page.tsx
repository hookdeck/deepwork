'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestEventsPage() {
  const { data: session } = useSession();
  const [researchId, setResearchId] = useState('');
  const [events, setEvents] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testEventCorrelation = async () => {
    if (!researchId.trim()) {
      setError('Please enter a research ID');
      return;
    }

    setLoading(true);
    setError(null);
    setEvents(null);

    try {
      const response = await fetch(`/api/researches/${researchId}/events`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }

      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <p>Please log in to test event correlation.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Event Correlation</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Research ID:
        </label>
        <input
          type="text"
          value={researchId}
          onChange={(e) => setResearchId(e.target.value)}
          placeholder="Enter research ID"
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={testEventCorrelation}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Fetch Events'}
      </button>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-200 rounded">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>First create a research using the /research page</li>
          <li>Copy the research ID from the response</li>
          <li>Paste it here and click "Fetch Events"</li>
          <li>You should see mock events (or real events if Hookdeck is configured)</li>
        </ol>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {events && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Events Response:</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded overflow-auto border border-gray-300 dark:border-gray-600">
            {JSON.stringify(events, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}