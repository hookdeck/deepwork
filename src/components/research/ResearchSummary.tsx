"use client";

import React from "react";
import { DeepResearchResponse } from "@/types/deep-research";
import { formatTimestamp } from "@/lib/utils/timestamp";

interface ResearchSummaryProps {
  response: DeepResearchResponse;
  searchCount: number;
  reasoningStepCount: number;
}

export default function ResearchSummary({
  response,
  searchCount,
  reasoningStepCount,
}: ResearchSummaryProps) {
  const totalTokens = response.usage?.total_tokens ?? 0;
  const promptTokens = response.usage?.prompt_tokens ?? 0;
  const completionTokens = response.usage?.completion_tokens ?? 0;
  const reasoningTokens =
    response.usage?.detailed_completion_tokens?.reasoning_tokens;
  const outputTokens =
    response.usage?.detailed_completion_tokens?.output_tokens;

  const hasError = !!response.error;

  // Calculate number of metrics to determine grid layout
  const showTotalTokens = totalTokens > 0;
  const showPromptCompletionTokens = promptTokens > 0 || completionTokens > 0;
  const metricsCount =
    2 + (showTotalTokens ? 1 : 0) + (showPromptCompletionTokens ? 1 : 0);

  // Dynamic grid classes based on actual metrics count
  const getGridClasses = () => {
    switch (metricsCount) {
      case 4:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";
      case 3:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
      case 2:
      default:
        return "grid grid-cols-1 sm:grid-cols-2 gap-4";
    }
  };

  return (
    <section className="mb-6">
      <div
        className={`rounded-lg border p-4 ${
          hasError
            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Research Summary
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: <span className="font-mono">{response.id}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Model: {response.model || "unknown"}
            </span>
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              Created:{" "}
              {formatTimestamp(response.created_at ?? response.created)}
            </span>
          </div>
        </div>

        {hasError && (
          <div className="mt-3 rounded-md border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
            <div className="font-medium">Error</div>
            <div>{response.error?.message}</div>
            <div className="text-xs opacity-80">
              Type: {response.error?.type}
              {response.error?.code ? ` • Code: ${response.error.code}` : ""}
            </div>
          </div>
        )}

        <div className={`mt-4 ${getGridClasses()}`}>
          <Metric label="Searches" value={searchCount} theme="blue" />
          <Metric
            label="Reasoning Steps"
            value={reasoningStepCount}
            theme="gray"
          />
          {showTotalTokens && (
            <Metric label="Total Tokens" value={totalTokens} theme="emerald" />
          )}
          {showPromptCompletionTokens && (
            <Metric
              label="Prompt / Completion"
              value={`${promptTokens} / ${completionTokens}`}
              theme="slate"
            />
          )}
        </div>

        {(reasoningTokens !== undefined || outputTokens !== undefined) && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            <span className="mr-2 font-medium">Detailed Tokens:</span>
            <span className="mr-2">Reasoning: {reasoningTokens ?? "—"}</span>
            <span>Output: {outputTokens ?? "—"}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  theme = "gray",
}: {
  label: string;
  value: string | number;
  theme?: "blue" | "gray" | "emerald" | "slate";
}) {
  const palettes: Record<string, { bg: string; text: string; ring: string }> = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-800 dark:text-blue-200",
      ring: "ring-blue-200 dark:ring-blue-800/50",
    },
    gray: {
      bg: "bg-gray-50 dark:bg-gray-900/40",
      text: "text-gray-800 dark:text-gray-200",
      ring: "ring-gray-200 dark:ring-gray-700/60",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-800 dark:text-emerald-200",
      ring: "ring-emerald-200 dark:ring-emerald-800/50",
    },
    slate: {
      bg: "bg-slate-50 dark:bg-slate-900/40",
      text: "text-slate-800 dark:text-slate-200",
      ring: "ring-slate-200 dark:ring-slate-700/60",
    },
  };
  const p = palettes[theme] ?? palettes.gray;

  return (
    <div className={`rounded-md ${p.bg} ring-1 ${p.ring} px-3 py-2`}>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-lg font-semibold ${p.text}`}>{value}</div>
    </div>
  );
}
