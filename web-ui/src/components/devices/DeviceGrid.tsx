import { useNavigate } from "@tanstack/react-router";
import type { Device } from "@/lib/schemas/device";
import { DeviceGridCard } from "./DeviceGridCard";

interface DeviceGridProps {
  devices: Device[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDelete: (id: string) => void;
  onViewEvents: (deviceId: string) => void;
  onEdit: (deviceId: string) => void;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading"
          className="animate-pulse rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-sm"
        >
          <div className="h-5 w-3/4 rounded bg-slate-700" />
          <div className="mt-3 h-4 w-1/3 rounded-full bg-slate-700" />
          <div className="mt-4 h-3 w-1/2 rounded bg-slate-700" />
          <div className="mt-4 border-t border-slate-700 pt-3">
            <div className="h-4 w-full rounded bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-full bg-red-900/30 p-4">
        <svg
          className="h-8 w-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <p className="text-lg font-medium text-slate-300">
        Failed to load devices
      </p>
      <p className="text-sm text-slate-400">Retry?</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
          />
        </svg>
        Retry
      </button>
    </div>
  );
}

function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-full bg-slate-700 p-4">
        <svg
          className="h-8 w-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-lg font-medium text-slate-400">No devices yet.</p>
      <p className="text-sm text-slate-500">Create your first device.</p>
      <button
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Create Device
      </button>
    </div>
  );
}

export function DeviceGrid({
  devices,
  isLoading,
  isError,
  onRetry,
  onDelete,
  onViewEvents,
  onEdit,
}: DeviceGridProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <SkeletonGrid />;
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (devices.length === 0) {
    return (
      <EmptyState onNavigate={() => navigate({ to: "/devices/create" })} />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {devices.map((device) => (
        <DeviceGridCard
          key={device.id}
          device={device}
          onDelete={onDelete}
          onViewEvents={onViewEvents}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
