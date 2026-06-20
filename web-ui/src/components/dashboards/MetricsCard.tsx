const FIELD_ORDER = ["requests_total", "errors_total"];

function sortMetricsByFieldOrder(
  entries: [string, unknown][],
): [string, unknown][] {
  return [...entries].sort(([a], [b]) => {
    const aIdx = FIELD_ORDER.indexOf(a);
    const bIdx = FIELD_ORDER.indexOf(b);
    // Known fields sort by FIELD_ORDER; unknown fields go after
    return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx);
  });
}

interface MetricsCardProps {
  title: string;
  metrics: Record<string, unknown>;
  isLoading: boolean;
  isUnavailable?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
      <div className="h-5 w-20 rounded bg-slate-700" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 rounded bg-slate-700" />
        <div className="h-16 rounded bg-slate-700" />
      </div>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: unknown }) {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : String(value ?? "—");

  const isErrorMetric = label.includes("error");
  const valueColor =
    isErrorMetric && typeof value === "number" && value > 0
      ? value > 50
        ? "text-red-400"
        : "text-amber-300"
      : "text-slate-100";

  return (
    <div className="rounded-lg bg-slate-700/50 p-4 text-center">
      <div className={`text-2xl font-bold ${valueColor}`}>{formattedValue}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
        {label.replace(/_/g, " ")}
      </div>
    </div>
  );
}

export function MetricsCard({
  title,
  metrics,
  isLoading,
  isUnavailable,
}: MetricsCardProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isUnavailable || Object.keys(metrics).length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">{title}</h3>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="rounded-full bg-red-900/30 p-3">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-400">Metrics unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {sortMetricsByFieldOrder(Object.entries(metrics)).map(([key, value]) => (
          <MetricItem key={key} label={key} value={value} />
        ))}
      </div>
    </div>
  );
}
