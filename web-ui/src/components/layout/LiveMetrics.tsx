import { useState } from "react";
import { useGoHealth, useNodeHealth } from "@/hooks/use-health";
import { useGoMetrics, useNodeMetrics } from "@/hooks/use-metrics";
import { useSettings } from "@/hooks/use-settings";
import { Modal } from "@/components/shared/Modal";
import { cn } from "@/lib/utils/cn";
import { classifyHealth, type HealthStatus } from "@/lib/utils/health-status";

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: "bg-green-500",
  stale: "bg-amber-400",
  unhealthy: "bg-red-500",
  offline: "bg-gray-400",
};

const STATUS_TITLES: Record<HealthStatus, string> = {
  healthy: "Healthy",
  stale: "Stale",
  unhealthy: "Unhealthy",
  offline: "Offline",
};

const STATUS_TEXT_CLASSES: Record<HealthStatus, string> = {
  healthy: "text-green-400",
  stale: "text-amber-400",
  unhealthy: "text-red-400",
  offline: "text-gray-400",
};

const PRIORITY_ORDER: HealthStatus[] = ["offline", "unhealthy", "stale", "healthy"];

function HealthDot({ status, label }: { status: HealthStatus; label: string }) {
  return (
    <div className="group relative flex items-center gap-1.5" title={STATUS_TITLES[status]}>
      <span
        className={cn("h-2.5 w-2.5 rounded-full", STATUS_COLORS[status])}
        role="img"
        aria-label={`${label} ${status}`}
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
  status: HealthStatus;
  requests: number | undefined;
  errors: number | undefined;
  lastRefresh: string;
}

function ServiceDetailCard({
  status,
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
          className={cn("h-3 w-3 rounded-full", STATUS_COLORS[status])}
        />
        <span className="text-sm font-medium text-slate-200">
          {STATUS_TITLES[status]}
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

  const goStatus = classifyHealth(goHealth.isError, goHealth.data, goHealth.error);
  const nodeStatus = classifyHealth(nodeHealth.isError, nodeHealth.data, nodeHealth.error);

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

  const worstStatus =
    PRIORITY_ORDER.find((s) => goStatus === s || nodeStatus === s) ?? "healthy";

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
      {/* Priority badge — worst health status across services */}
      {worstStatus !== "healthy" && (
        <span
          className={cn("flex items-center gap-1 text-xs", STATUS_TEXT_CLASSES[worstStatus])}
        >
          <span className={cn("h-2 w-2 rounded-full", STATUS_COLORS[worstStatus])} />
          {STATUS_TITLES[worstStatus]}
        </span>
      )}

      {/* Go service — clickable */}
      <button
        type="button"
        onClick={() => setDetailService("go")}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
        aria-label="Go metrics detail"
      >
        <HealthDot status={goStatus} label="Go API" />
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
        <HealthDot status={nodeStatus} label="Node API" />
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
            status={goStatus}
            requests={goReq}
            errors={goErr}
            lastRefresh={lastRefresh}
          />
        )}
        {detailService === "node" && (
          <ServiceDetailCard
            status={nodeStatus}
            requests={nodeReq}
            errors={nodeErr}
            lastRefresh={lastRefresh}
          />
        )}
      </Modal>
    </div>
  );
}
