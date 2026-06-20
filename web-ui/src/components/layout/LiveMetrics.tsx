import { useGoHealth, useNodeHealth } from "@/hooks/use-health";
import { useGoMetrics, useNodeMetrics } from "@/hooks/use-metrics";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils/cn";

function HealthDot({ healthy, label }: { healthy: boolean; label: string }) {
  return (
    <div className="group relative flex items-center gap-1.5" title={healthy ? "Healthy" : "Unhealthy"}>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          healthy ? "bg-green-500" : "bg-red-500",
        )}
        role="img"
        aria-label={healthy ? `${label} healthy` : `${label} unhealthy`}
      />
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}

function Counter({
  label,
  value,
  testId,
}: {
  label: string;
  value: number | "—";
  testId?: string;
}) {
  return (
    <span className="text-xs text-slate-400" data-testid={testId}>
      {label}: <span className="font-mono text-slate-300">{value}</span>
    </span>
  );
}

export function LiveMetrics() {
  const { healthInterval, metricsInterval } = useSettings();

  const goHealth = useGoHealth(healthInterval);
  const nodeHealth = useNodeHealth(healthInterval);
  const goMetrics = useGoMetrics(metricsInterval);
  const nodeMetrics = useNodeMetrics(metricsInterval);

  const goHealthy =
    !goHealth.isError && goHealth.data?.status === "ok";
  const nodeHealthy =
    !nodeHealth.isError && nodeHealth.data?.status === "ok";

  const goReq: number | undefined =
    !goMetrics.isError && goMetrics.data
      ? (goMetrics.data as Record<string, unknown>).requests_total as number
      : undefined;
  const goErr: number | undefined =
    !goMetrics.isError && goMetrics.data
      ? (goMetrics.data as Record<string, unknown>).errors_total as number
      : undefined;
  const nodeReq: number | undefined =
    !nodeMetrics.isError && nodeMetrics.data
      ? (nodeMetrics.data as Record<string, unknown>).requests_total as number
      : undefined;
  const nodeErr: number | undefined =
    !nodeMetrics.isError && nodeMetrics.data
      ? (nodeMetrics.data as Record<string, unknown>).errors_total as number
      : undefined;

  const hasError =
    goHealth.isError || nodeHealth.isError || goMetrics.isError || nodeMetrics.isError;

  return (
    <div
      data-testid="live-metrics"
      className={cn(
        "flex items-center gap-6 border-b border-slate-700 bg-slate-900/80 px-4 py-2",
        "overflow-x-auto whitespace-nowrap",
      )}
    >
      {/* Stale indicator */}
      {hasError && (
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Stale
        </span>
      )}

      {/* Go service */}
      <div className="flex items-center gap-3">
        <HealthDot healthy={goHealthy} label="Go" />
        <Counter label="req" value={goReq ?? "—"} testId="go-req" />
        <Counter label="err" value={goErr ?? "—"} testId="go-err" />
      </div>

      {/* Divider */}
      <span className="h-4 w-px bg-slate-700" />

      {/* Node service */}
      <div className="flex items-center gap-3">
        <HealthDot healthy={nodeHealthy} label="Node" />
        <Counter label="req" value={nodeReq ?? "—"} testId="node-req" />
        <Counter label="err" value={nodeErr ?? "—"} testId="node-err" />
      </div>
    </div>
  );
}
