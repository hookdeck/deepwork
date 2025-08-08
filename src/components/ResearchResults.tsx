interface ResearchResultsProps {
  data: string;
  className?: string;
}

export default function ResearchResults({ data, className = '' }: ResearchResultsProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Research Results</h3>
      </div>
      <div className="p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans">
            {data}
          </pre>
        </div>
      </div>
    </div>
  );
}