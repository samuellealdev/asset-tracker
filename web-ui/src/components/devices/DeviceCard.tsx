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
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-48 rounded bg-slate-200" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 h-4 w-40 rounded bg-slate-200" />
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
      <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-red-600">
          Failed to load device
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-indigo-600 hover:text-indigo-800"
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
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {device.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            ID: {device.id.length > 8 ? `${device.id.slice(0, 8)}...` : device.id}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          {device.type}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
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
