interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${i > 0 ? 'mt-2' : ''}`}
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function ResearchCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 ml-4" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="flex items-center">
            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}