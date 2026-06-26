import { useState, type ReactNode } from "react";
import { useDeletedDevices, useEvents } from "@/hooks/use-events";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DeviceGridCard } from "./DeviceGridCard";
import { Modal } from "@/components/shared/Modal";
import { EventTimeline } from "@/components/events/EventTimeline";
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
  const {
    data: events,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDeletedDevices();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const {
    data: deviceEvents,
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useEvents(selectedEvent?.deviceId);

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
            {isFetching && (
              <svg
                className="h-4 w-4 animate-spin text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
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
      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm transition-opacity duration-300">
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

            <hr className="border-slate-700" />

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-300">
                Event Timeline
              </h3>
              <div className="max-h-[60vh] overflow-y-auto">
                <EventTimeline
                  events={deviceEvents ?? []}
                  isLoading={eventsLoading}
                  isError={eventsError}
                  onRetry={() => refetchEvents()}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
