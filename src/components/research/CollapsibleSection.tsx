"use client";

import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string | number;
}

export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState<boolean>(defaultExpanded);

  return (
    <section className="mb-6">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-md text-left"
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 transition-transform ${
              open ? "rotate-90" : ""
            }`}
            title={open ? "Collapse section" : "Expand section"}
          >
            ▶
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {title}
          </span>
        </div>
        {badge !== undefined && (
          <span className="ml-2 inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
            {badge}
          </span>
        )}
      </button>

      <div
        role="region"
        aria-label={title}
        className={`transition-all overflow-hidden ${
          open ? "mt-3 max-h-[9999px]" : "max-h-0"
        }`}
      >
        <div className="px-1">{children}</div>
      </div>
    </section>
  );
}
