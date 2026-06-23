import type { ReactNode } from "react";
import { useDeletedDevices } from "@/hooks/use-events";
import { formatDate, truncateId } from "@/lib/utils/format";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export function DeletedDevicesList() {
  const { data: events, isLoading, isError, refetch } = useDeletedDevices();

  let content: ReactNode;

  if (isLoading) {
    content = <LoadingSkeleton rows={3} />;
  } else if (isError) {
    content = (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-sm text-red-400">Failed to load deleted devices</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Try again
        </button>
      </div>
    );
  } else if (!events || events.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-sm text-slate-400">No deleted devices</p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between rounded-lg bg-slate-700/30 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-200">
                {event.name}
              </span>
              <span className="font-mono text-xs text-slate-500">
                {truncateId(event.deviceId)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {event.actor && (
                <span className="text-xs text-slate-500">{event.actor}</span>
              )}
              <span className="text-xs text-slate-500">
                {formatDate(event.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-300">
        Deleted Devices
      </h2>
      {content}
    </section>
  );
}
