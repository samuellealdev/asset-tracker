import { useNavigate } from "@tanstack/react-router";
import type { Device } from "@/lib/schemas/device";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

interface DeviceTableProps {
  devices: Device[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDelete: (id: string) => void;
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
        Failed to load devices.
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

export function DeviceTable({
  devices,
  isLoading,
  isError,
  onRetry,
  onDelete,
}: DeviceTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (devices.length === 0) {
    return (
      <EmptyState
        title="No devices yet."
        description="Create your first device."
        actionLabel="Create Device"
        onAction={() => navigate({ to: "/devices/create" })}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-sm">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {devices.map((device, index) => (
            <tr
              key={device.id}
              className={`transition-colors duration-200 ${
                index % 2 === 0 ? "bg-transparent" : "bg-slate-800/50"
              } hover:bg-indigo-900/20`}
            >
              <td className="px-6 py-4">
                <button
                  onClick={() =>
                    navigate({ to: "/devices/$id", params: { id: device.id } })
                  }
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {device.name}
                </button>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                  {device.type}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                {new Date(device.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      navigate({
                        to: "/devices/$id",
                        params: { id: device.id },
                      })
                    }
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() =>
                      navigate({
                        to: "/devices/$id",
                        params: { id: device.id },
                      })
                    }
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(device.id)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-900/30"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
