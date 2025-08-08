import {
  EventTimeline,
  formatEventType,
  formatEventStatus,
  formatTimestamp,
} from "@/types/events";
import { useState } from "react";

interface TimelineEventProps {
  event: EventTimeline;
}

export default function TimelineEvent({ event }: TimelineEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEventIcon = () => {
    if (event.type === "outbound") {
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16l-4-4m0 0l4-4m-4 4h18"
        />
      </svg>
    );
  };

  const getStatusColor = () => {
    switch (event.status.toUpperCase()) {
      case "SUCCESS":
        return "text-green-600 bg-green-50 border-green-200";
      case "FAILED":
        return "text-red-600 bg-red-50 border-red-200";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getEventColor = () => {
    return event.type === "outbound"
      ? "bg-blue-500 text-white"
      : "bg-green-500 text-white";
  };

  return (
    <div className="flex items-start gap-4 pl-12">
      {/* Icon */}
      <div
        className={`absolute -left-3 flex items-center justify-center w-10 h-10 rounded-full ${getEventColor()} shadow-sm`}
      >
        {getEventIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {formatEventType(event.type)}
            </h4>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor()}`}
            >
              {formatEventStatus(event.status)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(event.timestamp)}
            </span>
          </div>
        </div>

        {event.data && (
          <div className="mt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
            >
              {isExpanded ? "Hide" : "Show"} event data
              <svg
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isExpanded && (
              <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
