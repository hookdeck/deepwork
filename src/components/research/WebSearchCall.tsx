"use client";

import React, { useState } from "react";
import {
  WebSearchCallOutput,
  WebSearchResult,
  WebSearchAction,
} from "@/types/deep-research";

interface WebSearchCallProps {
  searchCall: WebSearchCallOutput;
  index: number;
}

function RelevanceBar({ score }: { score?: number }) {
  const pct =
    typeof score === "number"
      ? Math.max(0, Math.min(100, Math.round(score)))
      : 0;
  return (
    <div className="w-full h-2 bg-blue-100 dark:bg-blue-950/40 rounded">
      <div
        className="h-2 bg-blue-500 dark:bg-blue-400 rounded"
        style={{ width: `${pct}%` }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        role="progressbar"
      />
    </div>
  );
}

function ResultCard({ result }: { result: WebSearchResult }) {
  const [expanded, setExpanded] = useState(false);
  const maxChars = 220;
  const needsTruncation = result.snippet && result.snippet.length > maxChars;
  const displayText =
    expanded || !needsTruncation
      ? result.snippet
      : result.snippet.slice(0, maxChars) + "…";

  return (
    <div className="rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3">
      <a
        href={result.url}
        target="_blank"
        rel="noreferrer"
        className="text-blue-700 dark:text-blue-300 font-medium underline decoration-dotted hover:decoration-solid"
      >
        {result.title || result.url}
      </a>
      <div className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5 break-all">
        {result.url}
      </div>

      <div className="mt-2 text-sm text-blue-900 dark:text-blue-100">
        {displayText}
        {needsTruncation && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-2 text-blue-700 dark:text-blue-300 underline decoration-dotted hover:decoration-solid"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-blue-900/70 dark:text-blue-200/80">
          Relevance
        </span>
        <div className="flex-1">
          <RelevanceBar
            score={
              typeof result.relevance_score === "number"
                ? result.relevance_score * 100
                : undefined
            }
          />
        </div>
        {typeof result.relevance_score === "number" && (
          <span className="text-xs text-blue-900/70 dark:text-blue-200/80 w-10 text-right">
            {Math.round(result.relevance_score)}%
          </span>
        )}
      </div>

      <div className="mt-2 text-xs text-blue-900/60 dark:text-blue-300/70 space-x-2">
        {result.published_date && (
          <span>Published: {result.published_date}</span>
        )}
        {result.source && <span>Source: {result.source}</span>}
      </div>
    </div>
  );
}

// SVG Icon Components
const SearchIcon = () => (
  <svg
    className="h-5 w-5 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const DocumentIcon = () => (
  <svg
    className="h-5 w-5 text-green-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const MagnifyingGlassIcon = () => (
  <svg
    className="h-5 w-5 text-purple-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 105.243-5.243 3 3 0 00-5.243 5.243z"
    />
  </svg>
);

const QuestionIcon = () => (
  <svg
    className="h-5 w-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

function getActionDisplay(action: WebSearchAction) {
  switch (action.type) {
    case "search":
      return {
        IconComponent: SearchIcon,
        label: "Search",
        detail: action.query,
        url: null,
      };
    case "open_page":
      return {
        IconComponent: DocumentIcon,
        label: "Open Page",
        detail: null, // We'll render the URL as a link separately
        url: action.url,
      };
    case "find_in_page":
      return {
        IconComponent: MagnifyingGlassIcon,
        label: "Find in Page",
        detail: `"${action.pattern}" in`,
        url: action.url,
      };
    default:
      return {
        IconComponent: QuestionIcon,
        label: "Unknown Action",
        detail: "",
        url: null,
      };
  }
}

export default function WebSearchCall({
  searchCall,
  index,
}: WebSearchCallProps) {
  const statusPill = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  }[searchCall.status || "completed"];

  const actionDisplay = getActionDisplay(searchCall.action);

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-gray-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs text-blue-700/80 dark:text-blue-300/80">
            Action #{index + 1}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-shrink-0">
              <actionDisplay.IconComponent />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-blue-800 dark:text-blue-200">
                {actionDisplay.label}
              </h4>
              <div className="text-xs text-blue-700/70 dark:text-blue-300/70 break-all">
                {actionDisplay.detail}
                {actionDisplay.url && (
                  <>
                    {actionDisplay.detail && " "}
                    <a
                      href={actionDisplay.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline underline transition-colors duration-200"
                    >
                      {actionDisplay.url}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusPill}`}
        >
          {searchCall.status}
        </span>
      </div>

      {searchCall.error && (
        <div className="mt-2 rounded border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {searchCall.error}
        </div>
      )}

      <div className="mt-3">
        <div className="text-sm text-blue-900/70 dark:text-blue-200/80">
          Action completed successfully
        </div>
      </div>
    </div>
  );
}
