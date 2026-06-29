import { cn } from "@/lib/utils/cn";
import type { RequestTrace } from "@/lib/api/metrics";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-blue-400",
  POST: "text-green-400",
  PUT: "text-amber-400",
  DELETE: "text-red-400",
};

const STATUS_COLOR_CLASS = (status: number): string => {
  if (status >= 200 && status < 300) return "text-green-400";
  if (status >= 300 && status < 400) return "text-blue-400";
  if (status >= 400 && status < 500) return "text-amber-400";
  if (status >= 500) return "text-red-400";
  return "text-slate-400";
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={cn("font-mono text-xs font-medium", METHOD_COLORS[method] ?? "text-slate-400")}>
      {method}
    </span>
  );
}

export interface TraceTableProps {
  traces: RequestTrace[];
}

export function TraceTable({ traces }: TraceTableProps) {
  if (traces.length === 0) {
    return <p className="text-sm text-slate-400">No recent requests</p>;
  }

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Recent Requests
      </h4>
      <div
        data-testid="trace-scroll-container"
        className="max-h-48 overflow-y-auto rounded border border-slate-700"
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-2 py-1 font-medium text-slate-500">Method</th>
              <th className="px-2 py-1 font-medium text-slate-500">Path</th>
              <th className="px-2 py-1 font-medium text-slate-500">Status</th>
              <th className="px-2 py-1 font-medium text-slate-500">Duration</th>
              <th className="px-2 py-1 font-medium text-slate-500">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {traces.map((trace, idx) => (
              <tr
                key={idx}
                className={cn(
                  "border-b border-slate-700/50 transition-colors hover:bg-slate-800/50",
                  trace.status >= 400 && "border-l-2 border-red-500",
                )}
              >
                <td className="px-2 py-1">
                  <MethodBadge method={trace.method} />
                </td>
                <td className="px-2 py-1 font-mono text-slate-300">
                  {trace.path}
                </td>
                <td className="px-2 py-1">
                  <span className={cn("font-mono", STATUS_COLOR_CLASS(trace.status))}>
                    {trace.status}
                  </span>
                </td>
                <td className="px-2 py-1 font-mono text-slate-300">
                  {trace.duration_ms.toFixed(1)}ms
                </td>
                <td className="px-2 py-1 text-slate-400">
                  {new Date(trace.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
