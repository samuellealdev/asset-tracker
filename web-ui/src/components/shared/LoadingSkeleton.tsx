import { cn } from "@/lib/utils/cn";

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({
  rows = 3,
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading"
          className="flex h-12 animate-pulse items-center rounded-lg bg-slate-800 px-4"
        >
          <div className="h-4 w-1/4 rounded bg-slate-700" />
          <div className="ml-8 h-4 w-1/6 rounded bg-slate-700" />
          <div className="ml-8 h-4 w-1/6 rounded bg-slate-700" />
          <div className="ml-auto h-4 w-24 rounded bg-slate-700" />
        </div>
      ))}
    </div>
  );
}
