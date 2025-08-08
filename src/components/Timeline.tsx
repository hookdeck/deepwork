import { ReactNode } from "react";

interface TimelineProps {
  children: ReactNode;
  className?: string;
}

export default function Timeline({ children, className = "" }: TimelineProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
      <div className="space-y-6 relative">{children}</div>
    </div>
  );
}
