interface HealthCardProps {
  name: string;
  port: number;
  isHealthy: boolean;
  dbStatus: string;
  isLoading: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="h-5 w-24 rounded bg-slate-200" />
      <div className="h-4 w-16 rounded bg-slate-200" />
      <div className="h-4 w-32 rounded bg-slate-200" />
    </div>
  );
}

export function HealthCard({ name, port, isHealthy, dbStatus, isLoading }: HealthCardProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        <span className="text-sm text-slate-400">:{port}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isHealthy ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-slate-600">
            {isHealthy ? "Healthy" : "Unhealthy"}
          </span>
        </div>

        {dbStatus && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Database:</span>
            <span
              className={`text-sm font-medium ${
                dbStatus === "connected"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {dbStatus}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
