import { useNavigate } from "@tanstack/react-router";
import type { Device } from "@/lib/schemas/device";

interface DeviceTableProps {
  devices: Device[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDelete: (id: string) => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex h-12 animate-pulse items-center rounded-lg bg-slate-100 px-4"
        >
          <div className="h-4 w-1/4 rounded bg-slate-200" />
          <div className="ml-8 h-4 w-1/6 rounded bg-slate-200" />
          <div className="ml-8 h-4 w-1/6 rounded bg-slate-200" />
          <div className="ml-auto h-4 w-24 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-full bg-slate-100 p-4">
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
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
          />
        </svg>
      </div>
      <p className="text-lg font-medium text-slate-600">
        No devices yet.
      </p>
      <p className="text-sm text-slate-400">
        Create your first device.
      </p>
      <button
        onClick={onCreateClick}
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

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-full bg-red-50 p-4">
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
      <p className="text-lg font-medium text-slate-600">
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
        onCreateClick={() => navigate({ to: "/devices/create" })}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {devices.map((device, index) => (
            <tr
              key={device.id}
              className={`transition-colors duration-200 ${
                index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
              } hover:bg-indigo-50/50`}
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
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {device.type}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
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
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100"
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
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(device.id)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
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
