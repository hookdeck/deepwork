"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Research } from "@/types/research";
import { EventTimeline } from "@/types/events";
import { formatTimestamp } from "@/lib/utils/timestamp";
import ProgressBar from "@/components/ProgressBar";
import Timeline from "@/components/Timeline";
import TimelineEvent from "@/components/TimelineEvent";
import ResearchResults from "@/components/ResearchResults";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const researchId = params.id as string;

  // Fetch research details with SWR
  const {
    data: research,
    error: researchError,
    isLoading: researchLoading,
  } = useSWR<Research>(
    session ? `/api/researches/${researchId}` : null,
    fetcher,
    {
      refreshInterval: (data) =>
        data?.status === "completed" ||
        data?.status === "failed" ||
        data?.status === "cancelled" ||
        data?.status === "incomplete"
          ? 0
          : 10000,
      revalidateOnFocus: true,
    }
  );

  // Fetch events with SWR
  const {
    data: eventsData,
    error: eventsError,
    isLoading: eventsLoading,
  } = useSWR<{ events: EventTimeline[] }>(
    session ? `/api/researches/${researchId}/events` : null,
    fetcher,
    {
      refreshInterval: (data) =>
        research?.status === "completed" ||
        research?.status === "failed" ||
        research?.status === "cancelled" ||
        research?.status === "incomplete"
          ? 0
          : 10000,
      revalidateOnFocus: true,
    }
  );

  const handleDownload = () => {
    if (!research || !eventsData) return;

    const dataStr = JSON.stringify(
      {
        research,
        events: eventsData.events,
      },
      null,
      2
    );
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `research-${research.id}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  if (status === "loading") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <LoadingSkeleton lines={3} className="mb-8" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You must be logged in to view research details.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (researchError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load research details. Please try again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Research["status"]) => {
    const statusStyles = {
      completed:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      processing:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      pending:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      cancelled:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      incomplete:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    };

    return (
      <span
        className={`px-3 py-1.5 text-sm font-medium rounded-full ${
          statusStyles[status] || statusStyles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/")}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center mb-4"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Research Details
        </h1>
      </div>

      {/* Overview Section */}
      <section className="mb-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Overview
            </h2>
            {research && getStatusBadge(research.status)}
          </div>

          <div className="p-6">
            {researchLoading ? (
              <LoadingSkeleton lines={4} />
            ) : research ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Research Question
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 text-lg">
                    {research.question}
                  </p>
                </div>

                {research.status === "processing" && (
                  <div>
                    <ProgressBar
                      progress={research.progress || 0}
                      size="lg"
                      showLabel={true}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Created
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatTimestamp(research.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Last Updated
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatTimestamp(research.updatedAt)}
                    </p>
                  </div>
                </div>

                {research.error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>Error:</strong> {research.error}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Research not found
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {research?.result && (
        <section className="mb-8">
          <ResearchResults data={research.result} />
        </section>
      )}

      {/* Events Timeline Section */}
      <section className="mb-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Timeline
            </h2>
          </div>

          <div className="p-6">
            {eventsLoading ? (
              <LoadingSkeleton lines={3} />
            ) : eventsData?.events && eventsData.events.length > 0 ? (
              <Timeline>
                {eventsData.events.map((event) => (
                  <TimelineEvent key={event.id} event={event} />
                ))}
              </Timeline>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No events yet. Events will appear as your research is processed.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Download Section */}
      {research?.status === "completed" && research.result && (
        <section>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Export Research Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Download the complete research results and event timeline as a
              JSON file.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Research Results
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
