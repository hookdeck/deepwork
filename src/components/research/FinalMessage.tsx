"use client";

import React from "react";
import { MessageOutput, Annotation } from "@/types/deep-research";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CitationList from "./CitationList";

interface FinalMessageProps {
  message: MessageOutput;
}

function ConfidencePill({ score }: { score?: number }) {
  if (typeof score !== "number") return null;

  const pct = Math.round(score * 100);
  let colorClass =
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  if (pct >= 90) {
    colorClass =
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
  } else if (pct >= 75) {
    colorClass =
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200";
  } else if (pct > 0) {
    colorClass =
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      Confidence: {pct}%
    </span>
  );
}

function renderTextWithAnnotations(text: string, annotations: Annotation[]) {
  if (!annotations || annotations.length === 0) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>;
  }

  // Sort annotations by start_index
  const sortedAnnotations = [...annotations].sort(
    (a, b) => a.start_index - b.start_index
  );

  const parts: string[] = [];
  let lastIndex = 0;

  sortedAnnotations.forEach((annotation, i) => {
    // Add text before annotation
    if (annotation.start_index > lastIndex) {
      parts.push(text.slice(lastIndex, annotation.start_index));
    }

    // Add a placeholder for the reference
    const referenceNumber = i + 1;
    parts.push(`[${referenceNumber}](#ref-${referenceNumber})`);

    lastIndex = annotation.end_index;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  const combinedText = parts.join("");

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => (
          <h3 className="text-xl font-bold mt-6 mb-2" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h4 className="text-lg font-bold mt-4 mb-2" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h5 className="text-md font-bold mt-2 mb-2" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h6 className="text-sm font-bold mt-2 mb-2" {...props} />
        ),
        p: ({ node, ...props }) => <p {...props} className="mb-4" />,
        a: ({ node, ...props }) => {
          const href = props.href || "";
          // Check if it's a reference link
          if (href.startsWith("#ref-")) {
            const refNum = parseInt(href.replace("#ref-", ""), 10);
            const annotation = sortedAnnotations[refNum - 1];
            if (annotation) {
              return (
                <a
                  {...props}
                  href={`#ref-${refNum}`}
                  title={`Reference ${refNum}: ${annotation.title}`}
                  className="text-blue-600 dark:text-blue-400 font-medium no-underline hover:underline"
                >
                  [{props.children}]
                </a>
              );
            }
          }
          // It's a regular link from the markdown
          return <a {...props} target="_blank" rel="noopener noreferrer" />;
        },
      }}
    >
      {combinedText}
    </ReactMarkdown>
  );
}

export default function FinalMessage({ message }: FinalMessageProps) {
  // Extract text and annotations from content array
  const contentItem =
    message.content && message.content.length > 0 ? message.content[0] : null;

  const contentText = contentItem?.text || "";
  const annotations = contentItem?.annotations || [];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contentText).catch((err) => {
      console.error("Failed to copy text: ", err);
    });
  };

  if (!contentText) {
    return (
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4">
        <h3 className="text-base font-semibold text-green-800 dark:text-green-200">
          Final Answer
        </h3>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">
          No content available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-green-800 dark:text-green-200">
          Final Answer
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copy to clipboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 2a1 1 0 00-1 1v1H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H8z" />
              <path d="M7 4h6a1 1 0 011 1v1H6V5a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none mt-3 text-gray-800 dark:text-gray-200">
        {renderTextWithAnnotations(contentText, annotations)}
      </div>

      {annotations.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            References
          </h4>
          <div className="space-y-2">
            {annotations.map((annotation, i) => (
              <div
                key={i}
                id={`ref-${i + 1}`}
                className="text-xs text-gray-600 dark:text-gray-400"
              >
                <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">
                  [{i + 1}]
                </span>
                <a
                  href={annotation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                >
                  {annotation.title}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
