"use client";

import React, { useMemo } from "react";
import { Citation } from "@/types/deep-research";

interface CitationListProps {
  citations: Citation[];
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function CitationList({ citations }: CitationListProps) {
  const grouped = useMemo(() => {
    // Flatten citations into entries with domains
    const entries = citations.flatMap((c) =>
      (c.sources ?? []).map((src) => ({
        source: src,
        domain: domainOf(src),
        text: c.text,
        confidence: c.confidence,
      }))
    );

    // Group by domain
    const map = new Map<string, { domain: string; items: typeof entries }>();
    for (const e of entries) {
      const key = e.domain || "unknown";
      if (!map.has(key)) {
        map.set(key, { domain: key, items: [] as typeof entries });
      }
      map.get(key)!.items.push(e);
    }

    // Sort domains alphabetically
    return Array.from(map.values()).sort((a, b) =>
      a.domain.localeCompare(b.domain)
    );
  }, [citations]);

  if (!citations?.length) {
    return (
      <div className="text-sm text-amber-700 dark:text-amber-300">
        No citations available.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
      <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
        Citations
      </h4>

      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.domain}>
            <div className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
              {g.domain}
            </div>
            <ol className="list-decimal ml-5 space-y-1">
              {g.items.map((item, idx) => (
                <li key={item.source + idx} className="text-sm">
                  <a
                    href={item.source}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-800 dark:text-amber-300 underline decoration-dotted hover:decoration-solid"
                    title={item.text}
                  >
                    {item.source}
                  </a>
                  {typeof item.confidence === "number" && (
                    <span className="ml-2 text-xs text-amber-700/80 dark:text-amber-300/80">
                      Confidence: {Math.round(item.confidence * 100)}%
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
