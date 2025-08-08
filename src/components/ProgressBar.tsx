interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({ 
  progress, 
  className = '', 
  showLabel = true,
  size = 'md' 
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`space-y-1 ${className}`}>
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`bg-blue-600 ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Progress</span>
          <span>{clampedProgress}%</span>
        </div>
      )}
    </div>
  );
}