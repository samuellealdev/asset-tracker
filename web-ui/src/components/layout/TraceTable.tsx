import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { RequestTrace } from "@/lib/api/metrics";

// ── Filter types and pure functions ──

export const METHODS = ["ALL", "GET", "POST", "PUT", "DELETE"] as const;
export type MethodFilter = (typeof METHODS)[number];

export interface FilterState {
  method: MethodFilter;
  errorsOnly: boolean;
  pathSearch: string;
}

export function applyFilters(traces: RequestTrace[], filters: FilterState): RequestTrace[] {
  return traces.filter((trace) => {
    if (filters.method !== "ALL" && trace.method !== filters.method) return false;
    if (filters.errorsOnly && trace.status < 400) return false;
    if (filters.pathSearch && !trace.path.toLowerCase().includes(filters.pathSearch.toLowerCase())) return false;
    return true;
  });
}

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.method !== "ALL") count++;
  if (filters.errorsOnly) count++;
  if (filters.pathSearch.length > 0) count++;
  return count;
}

// ── End filter types ──

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
  const [filters, setFilters] = useState<FilterState>({
    method: "ALL",
    errorsOnly: false,
    pathSearch: "",
  });

  const filteredTraces = applyFilters(traces, filters);
  const activeCount = countActiveFilters(filters);

  // No data at all
  if (traces.length === 0) {
    return <p className="text-sm text-slate-400">No recent requests</p>;
  }

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Recent Requests
      </h4>

      {/* Filter bar */}
      <div className="mb-2 flex flex-wrap items-center gap-2" data-testid="filter-bar">
        {/* Method chips */}
        <div className="inline-flex gap-1">
          {METHODS.map((method) => (
            <button
              key={method}
              type="button"
              data-testid={`method-chip-${method}`}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  method: prev.method === method ? "ALL" : method,
                }))
              }
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                filters.method === method
                  ? "bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700",
              )}
            >
              {method}
            </button>
          ))}
        </div>

        {/* Error toggle */}
        <button
          type="button"
          data-testid="error-toggle"
          onClick={() =>
            setFilters((prev) => ({ ...prev, errorsOnly: !prev.errorsOnly }))
          }
          className={cn(
            "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
            filters.errorsOnly
              ? "border border-red-500 bg-red-500/10 text-red-400"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700",
          )}
        >
          {filters.errorsOnly && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-red-500"
              data-testid="error-dot"
            />
          )}
          Errors only
        </button>

        {/* Path search */}
        <input
          type="text"
          data-testid="path-search"
          placeholder="Filter by path..."
          value={filters.pathSearch}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, pathSearch: e.target.value }))
          }
          className="w-40 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 placeholder-slate-500"
        />

        {/* Active count badge */}
        {activeCount > 0 && (
          <span
            data-testid="active-count"
            className="rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white"
          >
            {activeCount}
          </span>
        )}

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            type="button"
            data-testid="clear-all"
            onClick={() =>
              setFilters({ method: "ALL", errorsOnly: false, pathSearch: "" })
            }
            className="text-xs text-red-400 transition-colors hover:text-red-300"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filtered empty state */}
      {filteredTraces.length === 0 ? (
        <p className="text-sm text-slate-400">No matching requests</p>
      ) : (
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
              {filteredTraces.map((trace, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-b border-slate-700/50 transition-colors",
                    trace.status >= 400 && "bg-red-950/20 hover:bg-red-950/30",
                  )}
                >
                  <td className="px-2 py-1">
                    <MethodBadge method={trace.method} />
                  </td>
                  <td className={cn("px-2 py-1 font-mono", trace.status >= 400 ? "text-red-300" : "text-slate-300")}>
                    {trace.path}
                  </td>
                  <td className="px-2 py-1">
                    <span className={cn("font-mono", STATUS_COLOR_CLASS(trace.status))}>
                      {trace.status}
                    </span>
                  </td>
                  <td className={cn("px-2 py-1 font-mono", trace.status >= 400 ? "text-red-300" : "text-slate-300")}>
                    {trace.duration_ms.toFixed(1)}ms
                  </td>
                  <td className={cn("px-2 py-1", trace.status >= 400 ? "text-red-300/80" : "text-slate-400")}>
                    {new Date(trace.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
