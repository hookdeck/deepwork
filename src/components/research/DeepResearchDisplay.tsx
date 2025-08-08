"use client";

import React, { useMemo } from "react";
import {
  DeepResearchResponse,
  DeepResearchOutput,
  WebSearchCallOutput,
  ReasoningOutput,
  MessageOutput,
  isWebSearchCall,
  isReasoning,
  isMessage,
} from "@/types/deep-research";
import ResearchSummary from "@/components/research/ResearchSummary";
import CollapsibleSection from "@/components/research/CollapsibleSection";
import WebSearchCall from "@/components/research/WebSearchCall";
import ReasoningStep from "@/components/research/ReasoningStep";
import FinalMessage from "@/components/research/FinalMessage";

interface DeepResearchDisplayProps {
  data: string; // JSON string to be parsed
  className?: string;
}

export default function DeepResearchDisplay({
  data,
  className,
}: DeepResearchDisplayProps) {
  // Parse JSON and handle errors
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data) as DeepResearchResponse;
    } catch {
      return null;
    }
  }, [data]);

  // Categorize outputs
  const { searches, reasoning, messages } = useMemo(() => {
    const buckets = {
      searches: [] as WebSearchCallOutput[],
      reasoning: [] as ReasoningOutput[],
      messages: [] as MessageOutput[],
    };

    if (parsedData?.output && Array.isArray(parsedData.output)) {
      for (const item of parsedData.output as DeepResearchOutput[]) {
        if (isWebSearchCall(item)) buckets.searches.push(item);
        else if (isReasoning(item)) buckets.reasoning.push(item);
        else if (isMessage(item)) buckets.messages.push(item);
      }
    }

    return buckets;
  }, [parsedData]);

  // Filter reasoning steps - only show section if there's meaningful content
  const filteredReasoning = useMemo(() => {
    // Check if any reasoning step has meaningful content
    const hasMeaningfulContent = reasoning.some(
      (step) =>
        step.summary &&
        step.summary.length > 0 &&
        step.summary.some((s) => s.trim().length > 0)
    );

    // If no meaningful content, return empty array to hide the section
    return hasMeaningfulContent ? reasoning : [];
  }, [reasoning]);

  if (!parsedData) {
    // If parsing failed, render nothing (caller will fallback)
    return null;
  }

  return (
    <div className={className}>
      <ResearchSummary
        response={parsedData}
        searchCount={searches.length}
        reasoningStepCount={reasoning.length}
      />

      {/* Search Results Section */}
      <CollapsibleSection
        title="Web Searches"
        badge={searches.length}
        defaultExpanded={false}
      >
        {searches.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-4">
            No web searches recorded.
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map((search, idx) => (
              <WebSearchCall key={idx} searchCall={search} index={idx} />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Reasoning Section */}
      {filteredReasoning.length > 0 && (
        <CollapsibleSection
          title="AI Reasoning Process"
          badge={filteredReasoning.length}
          defaultExpanded={false}
        >
          <div className="space-y-3">
            {filteredReasoning.map((step, idx) => (
              <ReasoningStep key={idx} reasoning={step} stepNumber={idx + 1} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Final Answer(s) */}
      <div className="mt-6 space-y-6">
        {messages.map((msg, idx) => (
          <FinalMessage key={idx} message={msg} />
        ))}
        {messages.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-2">
            No final assistant messages.
          </div>
        )}
      </div>
    </div>
  );
}
