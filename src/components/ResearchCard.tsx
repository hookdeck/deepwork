import Link from "next/link";
import { Research } from "@/types/research";
import { formatTimestamp } from "@/lib/utils/timestamp";

interface ResearchCardProps {
  research: Research;
}

function getSummary(result: string | undefined): string {
  if (!result) return "No result available.";
  try {
    const parsed = JSON.parse(result);
    // Attempt to find a summary or title in the result object
    const summary = parsed.summary || parsed.title || parsed.answer;
    if (typeof summary === "string") {
      return summary;
    }
    // Fallback for nested structures
    if (parsed.data && (parsed.data.summary || parsed.data.title)) {
      return parsed.data.summary || parsed.data.title;
    }
    // Generic fallback: find the first string value in the object
    const firstString = findFirstString(parsed);
    if (firstString) {
      return firstString;
    }
    return "Result available. Click to view details.";
  } catch (error) {
    // If parsing fails, it might be a simple string result
    if (typeof result === "string") {
      return result;
    }
    return "Could not parse research result.";
  }
}

function findFirstString(obj: any): string | null {
  if (!obj || typeof obj !== "object") {
    return null;
  }

  let bestCandidate: string | null = null;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === "string") {
        // Exclude common ID-like patterns and short, non-descriptive strings
        if (
          value.length > 25 &&
          !key.toLowerCase().includes("id") &&
          !value.startsWith("resp_")
        ) {
          // Prioritize longer strings as they are more likely to be descriptive content
          if (!bestCandidate || value.length > bestCandidate.length) {
            bestCandidate = value;
          }
        }
      } else if (typeof value === "object") {
        const nestedCandidate = findFirstString(value);
        if (
          nestedCandidate &&
          (!bestCandidate || nestedCandidate.length > bestCandidate.length)
        ) {
          bestCandidate = nestedCandidate;
        }
      }
    }
  }

  if (bestCandidate) {
    // Strip leading markdown header line
    const trimmed = bestCandidate.trim();
    if (trimmed.startsWith("#")) {
      const newlineIndex = trimmed.indexOf("\n");
      if (newlineIndex !== -1) {
        return trimmed.substring(newlineIndex + 1).trim();
      }
      // It's a header with no content after it, return empty
      return "";
    }
    return trimmed;
  }

  return null;
}

export default function ResearchCard({ research }: ResearchCardProps) {
  const getStatusColor = (status: Research["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "processing":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <Link href={`/research/${research.id}`}>
      <div className="block bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
            {research.question}
          </h3>
          <span
            className={`ml-4 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
              research.status
            )}`}
          >
            {research.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{formatTimestamp(research.createdAt)}</span>
          {research.progress !== undefined &&
            research.status === "processing" && (
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${research.progress}%` }}
                  />
                </div>
                <span className="text-xs">{research.progress}%</span>
              </div>
            )}
        </div>

        {research.status === "completed" && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {getSummary(research.result)}
          </p>
        )}

        {research.status === "failed" && research.error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 line-clamp-2">
            Error: {research.error}
          </p>
        )}
      </div>
    </Link>
  );
}
