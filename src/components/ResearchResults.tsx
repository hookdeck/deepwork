import { useState, useMemo } from "react";
import DeepResearchDisplay from "./research/DeepResearchDisplay";
import { DeepResearchResponse } from "@/types/deep-research";

interface ResearchResultsProps {
  data: string;
  className?: string;
}

export default function ResearchResults({
  data,
  className = "",
}: ResearchResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Detect if this is a Deep Research response
  const isDeepResearch = useMemo(() => {
    try {
      const parsed = JSON.parse(data);

      // Check if it's a Deep Research response based on actual API structure
      const hasDeepResearchStructure =
        parsed.object === "response" &&
        parsed.output &&
        Array.isArray(parsed.output) &&
        parsed.model &&
        parsed.model.includes("deep-research");

      // Alternative check for output array with typical Deep Research item types
      const hasDeepResearchItems =
        parsed.output &&
        Array.isArray(parsed.output) &&
        parsed.output.some(
          (item: any) =>
            item.type === "reasoning" ||
            item.type === "web_search_call" ||
            (item.type === "message" &&
              item.content &&
              Array.isArray(item.content))
        );

      return hasDeepResearchStructure || hasDeepResearchItems;
    } catch {
      return false;
    }
  }, [data]);

  // If it's Deep Research data, use the specialized display
  if (isDeepResearch) {
    return <DeepResearchDisplay data={data} className={className} />;
  }

  // Otherwise, fall back to the existing raw display
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Research Results
        </h3>
      </div>
      <div className="p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre
            className={`whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans ${
              isExpanded ? "" : "max-h-60 overflow-hidden"
            }`}
          >
            {data}
          </pre>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 dark:text-blue-400 hover:underline mt-4"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        </div>
      </div>
    </div>
  );
}
