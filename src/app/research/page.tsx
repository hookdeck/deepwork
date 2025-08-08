'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Research {
  id: string;
  question: string;
  status: string;
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TestResearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [researches, setResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchResearches();
    }
  }, [session]);

  const fetchResearches = async () => {
    try {
      const response = await fetch('/api/researches');
      if (!response.ok) throw new Error('Failed to fetch researches');
      const data = await response.json();
      setResearches(data.researches || []);
    } catch (err) {
      console.error('Error fetching researches:', err);
    }
  };

  const submitResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/researches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit research');
      }

      const newResearch = await response.json();
      setResearches([newResearch, ...researches]);
      setQuestion('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Research Workflow</h1>
      
      <form onSubmit={submitResearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your research question..."
            className="flex-1 px-4 py-2 border rounded-lg bg-card border-muted"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Research History</h2>
        {researches.length === 0 ? (
          <p className="text-muted-foreground">No research questions yet.</p>
        ) : (
          researches.map((research) => (
            <div key={research.id} className="border rounded-lg p-4 bg-card border-muted">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{research.question}</h3>
                <span className={`px-2 py-1 text-sm rounded ${
                  research.status === 'completed' ? 'bg-green-100 text-green-800' :
                  research.status === 'failed' ? 'bg-red-100 text-red-800' :
                  research.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {research.status}
                </span>
              </div>
              {research.result && (
                <div>
                  <h4 className="font-medium mt-4">Result:</h4>
                  <pre className="text-muted mt-2 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(JSON.parse(research.result), null, 2)}
                  </pre>
                </div>
              )}
              {research.error && (
                <p className="text-danger mt-2">Error: {research.error}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Created: {new Date(research.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Note:</h3>
        <p className="text-sm text-muted">
          This is a test page for the research workflow. In production, the OpenAI 
          responses would be processed through Hookdeck webhooks. Here, we're simulating 
          the webhook response 2 seconds after submission.
        </p>
      </div>
    </div>
  );
}