import { useState, type ReactNode } from "react";
import { useDeletedDevices } from "@/hooks/use-events";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DeviceGridCard } from "./DeviceGridCard";
import { Modal } from "@/components/shared/Modal";
import type { Device } from "@/lib/schemas/device";
import type { Event } from "@/lib/schemas/event";

interface DeletedDevicesListProps {
  showDeleted: boolean;
  onToggle: () => void;
}

function mapEventToDevice(event: {
  deviceId: string;
  name: string;
  timestamp: string;
}): Device {
  return {
    id: event.deviceId,
    name: event.name,
    type: "Deleted",
    createdAt: event.timestamp,
  };
}

export function DeletedDevicesList({
  showDeleted,
  onToggle,
}: DeletedDevicesListProps) {
  const { data: events, isLoading, isError, refetch } = useDeletedDevices();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Don't render anything until data arrives
  if (!events && !isLoading && !isError) {
    return null;
  }

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
      <>
        {events.length > 0 && (
          <button
            onClick={onToggle}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
          >
            {showDeleted
              ? "Hide deleted devices"
              : `Show deleted devices (${events.length})`}
          </button>
        )}

        <div
          className={`overflow-hidden transition-all duration-300 ${
            showDeleted ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <DeviceGridCard
                key={event.id}
                device={mapEventToDevice(event)}
                onDetails={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-300">
          Deleted Devices
        </h2>
        {content}
      </section>

      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Deleted Device"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-medium text-slate-400">
                Name
              </span>
              <p className="mt-0.5 text-sm text-slate-100">
                {selectedEvent.name}
              </p>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-400">
                Device ID
              </span>
              <p className="mt-0.5 break-all font-mono text-xs text-slate-100">
                {selectedEvent.deviceId}
              </p>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-400">
                Deleted at
              </span>
              <p className="mt-0.5 text-sm text-slate-100">
                {new Date(selectedEvent.timestamp).toLocaleDateString()}
              </p>
            </div>
            {selectedEvent.actor && (
              <div>
                <span className="block text-xs font-medium text-slate-400">
                  Actor
                </span>
                <p className="mt-0.5 text-sm text-slate-100">
                  {selectedEvent.actor}
                </p>
              </div>
            )}
            {selectedEvent.description && (
              <div>
                <span className="block text-xs font-medium text-slate-400">
                  Description
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-100">
                  {selectedEvent.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
