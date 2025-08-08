"use client";

import React, { useState } from "react";
import { ReasoningOutput } from "@/types/deep-research";

interface ReasoningStepProps {
  reasoning: ReasoningOutput;
  stepNumber: number;
}

function ReasoningTypeBadge({ type }: { type?: string }) {
  const palettes: Record<string, { bg: string; text: string }> = {
    analysis: {
      bg: "bg-sky-100 dark:bg-sky-900/40",
      text: "text-sky-800 dark:text-sky-200",
    },
    synthesis: {
      bg: "bg-indigo-100 dark:bg-indigo-900/40",
      text: "text-indigo-800 dark:text-indigo-200",
    },
    evaluation: {
      bg: "bg-amber-100 dark:bg-amber-900/40",
      text: "text-amber-800 dark:text-amber-200",
    },
    planning: {
      bg: "bg-purple-100 dark:bg-purple-900/40",
      text: "text-purple-800 dark:text-purple-200",
    },
    default: {
      bg: "bg-gray-100 dark:bg-gray-700",
      text: "text-gray-800 dark:text-gray-200",
    },
  };
  const p = palettes[type || ""] ?? palettes.default;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${p.bg} ${p.text}`}
    >
      {type || "reasoning"}
    </span>
  );
}

export default function ReasoningStep({
  reasoning,
  stepNumber,
}: ReasoningStepProps) {
  const [expanded, setExpanded] = useState(false);
  const maxChars = 400;

  // Get content from the summary array
  const contentText =
    reasoning.summary && reasoning.summary.length > 0
      ? reasoning.summary.join(" ")
      : "";

  // If there's no content, show a placeholder indicating the reasoning step occurred
  if (!contentText) {
    return (
      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
            {stepNumber}
          </div>
          <div className="flex-1">
            <ReasoningTypeBadge type={reasoning.reasoning_type} />
          </div>
        </div>
        <div className="mt-2 pl-10 text-sm text-gray-500 dark:text-gray-400 italic">
          AI reasoning step completed (details not available)
        </div>
      </div>
    );
  }

  const needsTruncation = contentText && contentText.length > maxChars;
  const displayText =
    expanded || !needsTruncation
      ? contentText
      : contentText.slice(0, maxChars) + "…";

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
          {stepNumber}
        </div>
        <div className="flex-1">
          <ReasoningTypeBadge type={reasoning.reasoning_type} />
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none mt-2 pl-10 text-gray-800 dark:text-gray-200">
        <p className="whitespace-pre-wrap">{displayText}</p>
      </div>

      {needsTruncation && (
        <div className="pl-10 mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm text-blue-600 dark:text-blue-400 underline decoration-dotted hover:decoration-solid"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </div>
  );
}
