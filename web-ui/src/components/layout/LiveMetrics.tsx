import { useState } from "react";
import { useGoHealth, useNodeHealth } from "@/hooks/use-health";
import { useGoMetrics, useNodeMetrics } from "@/hooks/use-metrics";
import { useSettings } from "@/hooks/use-settings";
import { Modal } from "@/components/shared/Modal";
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

interface ServiceDetailProps {
  healthy: boolean;
  requests: number | undefined;
  errors: number | undefined;
  lastRefresh: string;
}

function ServiceDetailCard({
  healthy,
  requests,
  errors,
  lastRefresh,
}: ServiceDetailProps) {
  const errRate =
    requests !== undefined && requests > 0 && errors !== undefined
      ? ((errors / requests) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-3">
      {/* Health badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-3 w-3 rounded-full",
            healthy ? "bg-green-500" : "bg-red-500",
          )}
        />
        <span className="text-sm font-medium text-slate-200">
          {healthy ? "Healthy" : "Unhealthy"}
        </span>
      </div>

      {/* Last refresh */}
      <div className="text-xs text-slate-400">
        Last refresh: <span className="font-mono text-slate-300">{lastRefresh}</span>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700" />

      {/* Metrics */}
      {requests !== undefined ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Requests</span>
            <span className="font-mono text-sm text-slate-100">{requests.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Errors</span>
            <span className="font-mono text-sm text-red-400">{errors?.toLocaleString() ?? 0}</span>
          </div>
          {errRate !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Error rate</span>
              <span className="font-mono text-sm text-slate-100">{errRate}%</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No requests yet</p>
      )}
    </div>
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

  const [detailService, setDetailService] = useState<"go" | "node" | null>(null);

  const lastRefresh = new Date().toLocaleString();

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

      {/* Go service — clickable */}
      <button
        type="button"
        onClick={() => setDetailService("go")}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
        aria-label="Go metrics detail"
      >
        <HealthDot healthy={goHealthy} label="Go API" />
        <Counter label="req" value={goReq ?? "—"} testId="go-req" />
        <Counter label="err" value={goErr ?? "—"} testId="go-err" />
      </button>

      {/* Divider */}
      <span className="h-4 w-px bg-slate-700" />

      {/* Node service — clickable */}
      <button
        type="button"
        onClick={() => setDetailService("node")}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
        aria-label="Node metrics detail"
      >
        <HealthDot healthy={nodeHealthy} label="Node API" />
        <Counter label="req" value={nodeReq ?? "—"} testId="node-req" />
        <Counter label="err" value={nodeErr ?? "—"} testId="node-err" />
      </button>

      {/* Detail modal */}
      <Modal
        isOpen={detailService !== null}
        onClose={() => setDetailService(null)}
        title={detailService === "go" ? "Go API Metrics" : "Node.js API Metrics"}
      >
        {detailService === "go" && (
          <ServiceDetailCard
            healthy={goHealthy}
            requests={goReq}
            errors={goErr}
            lastRefresh={lastRefresh}
          />
        )}
        {detailService === "node" && (
          <ServiceDetailCard
            healthy={nodeHealthy}
            requests={nodeReq}
            errors={nodeErr}
            lastRefresh={lastRefresh}
          />
        )}
      </Modal>
    </div>
  );
}
