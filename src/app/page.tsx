"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import ResearchForm from "@/components/ResearchForm";
import ResearchCard from "@/components/ResearchCard";
import { ResearchCardSkeleton } from "@/components/LoadingSkeleton";
import { Research } from "@/types/research";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch researches with SWR
  const { data, error, isLoading, mutate } = useSWR<{ researches: Research[] }>(
    session ? "/api/researches" : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
    }
  );

  const handleSubmitResearch = async (question: string) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/researches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit research");
      }

      setSubmitSuccess(true);
      // Revalidate the data
      mutate();

      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">DeepWork</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            AI-powered research with Hookdeck queuing
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In to Get Started
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">DeepWork Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Submit complex research questions and track their progress
        </p>
      </div>

      {/* Research Submission Form */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-4">New Research Request</h2>
        <ResearchForm
          onSubmit={handleSubmitResearch}
          isSubmitting={isSubmitting}
        />

        {submitError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {submitError}
            </p>
          </div>
        )}

        {submitSuccess && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              Research request submitted successfully! You'll see it appear
              below shortly.
            </p>
          </div>
        )}
      </div>

      {/* Research List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Research Requests</h2>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load research requests. Please refresh the page.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <ResearchCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.researches && data.researches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.researches.map((research) => (
              <ResearchCard key={research.id} research={research} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No research requests yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Submit your first research question above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
