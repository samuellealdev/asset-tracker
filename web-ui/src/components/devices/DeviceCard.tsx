import { useNavigate } from "@tanstack/react-router";
import type { Device } from "@/lib/schemas/device";

interface DeviceCardProps {
  device: Device;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 w-32 rounded bg-slate-700" />
          <div className="mt-2 h-4 w-48 rounded bg-slate-700" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-700" />
      </div>
      <div className="mt-4 h-4 w-40 rounded bg-slate-700" />
    </div>
  );
}

export function DeviceCard({ device, isLoading, isError, onRetry }: DeviceCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-400">
          Failed to load device
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() =>
        navigate({ to: "/devices/$id", params: { id: device.id } })
      }
      className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm transition-all duration-200 hover:border-indigo-500 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            {device.name}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            ID: <span className="font-mono">{device.id}</span>
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-300">
          {device.type}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Created: {new Date(device.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
