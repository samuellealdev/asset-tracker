import { cn } from "@/lib/utils/cn";

interface LoadingSkeletonProps {
  rows?: number;
  variant?: "rows" | "grid";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  rows = 3,
  variant = "rows",
  count = 1,
  className,
}: LoadingSkeletonProps) {
  if (variant === "grid") {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          className,
        )}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            role="status"
            aria-label="Loading"
            className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-sm"
          >
            <div className="h-6 w-3/4 animate-pulse rounded bg-slate-700/50" />
            <div className="mt-2 h-5 w-20 animate-pulse rounded bg-slate-700/50" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded bg-slate-700/50" />
            <div className="mt-4 flex items-center gap-1 border-t border-slate-700 pt-3">
              <div className="h-8 w-16 animate-pulse rounded bg-slate-700/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
