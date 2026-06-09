import { cn } from '../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200',
        {
          'h-4 w-full': variant === 'default',
          'h-10 w-10 rounded-full': variant === 'circle',
          'h-4 w-3/4': variant === 'text',
        },
        className
      )}
    />
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 1 }: CardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-start gap-4">
            <Skeleton variant="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton variant="text" />
              <Skeleton variant="text" className="w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
        <Skeleton className="h-6 w-1/4" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className={colIndex === 0 ? 'h-5 w-12' : 'h-5 flex-1'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
