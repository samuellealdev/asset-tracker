import type { ReactNode } from "react";
import { useDeletedDevices } from "@/hooks/use-events";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DeletedDeviceCard } from "./DeletedDeviceCard";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => (
          <DeletedDeviceCard
            key={event.id}
            name={event.name}
            deviceId={event.deviceId}
            timestamp={event.timestamp}
          />
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
