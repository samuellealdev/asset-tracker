import { createFileRoute } from "@tanstack/react-router";
import { useGoHealth, useNodeHealth } from "@/hooks/use-health";
import { useGoMetrics, useNodeMetrics } from "@/hooks/use-metrics";
import { HealthCard } from "@/components/dashboards/HealthCard";
import { MetricsCard } from "@/components/dashboards/MetricsCard";

export function DashboardsPage() {
  const { data: goHealth, isLoading: goHealthLoading, isError: goHealthError } = useGoHealth();
  const { data: nodeHealth, isLoading: nodeHealthLoading, isError: nodeHealthError } = useNodeHealth();
  const { data: goMetrics, isLoading: goMetricsLoading, isError: goMetricsError } = useGoMetrics();
  const { data: nodeMetrics, isLoading: nodeMetricsLoading, isError: nodeMetricsError } = useNodeMetrics();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Auto-refreshes every 30s
        </span>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Service Health</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <HealthCard
            name="Go API"
            port={8080}
            isHealthy={!goHealthError && !!goHealth}
            dbStatus={
              goHealthLoading
                ? ""
                : goHealthError
                  ? "unreachable"
                  : (goHealth?.database as string) ?? "unknown"
            }
            isLoading={goHealthLoading}
          />
          <HealthCard
            name="Node.js API"
            port={3000}
            isHealthy={!nodeHealthError && !!nodeHealth}
            dbStatus={
              nodeHealthLoading
                ? ""
                : nodeHealthError
                  ? "unreachable"
                  : (nodeHealth?.database as string) ?? "unknown"
            }
            isLoading={nodeHealthLoading}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Metrics</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <MetricsCard
            title="Go API"
            metrics={(goMetrics ?? {}) as Record<string, unknown>}
            isLoading={goMetricsLoading}
            isUnavailable={goMetricsError}
          />
          <MetricsCard
            title="Node.js API"
            metrics={(nodeMetrics ?? {}) as Record<string, unknown>}
            isLoading={nodeMetricsLoading}
            isUnavailable={nodeMetricsError}
          />
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/dashboards")({
  component: DashboardsPage,
});
