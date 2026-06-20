import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { useDevices } from "@/hooks/use-devices";
import { EventTable } from "@/components/events/EventTable";
import { EventForm } from "@/components/events/EventForm";

export function EventsPage() {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const { data: events, isLoading, isError, refetch } = useEvents(selectedDeviceId || undefined);
  const { data: devices } = useDevices();
  const createEvent = useCreateEvent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Event
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="device-filter" className="text-sm font-medium text-slate-700">
          Filter by device
        </label>
        <select
          id="device-filter"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All devices</option>
          {(devices ?? []).map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              New Event
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
          <EventForm
            devices={devices ?? []}
            isPending={createEvent.isPending}
            onSubmit={async (input) => {
              setError(null);
              try {
                await createEvent.mutateAsync(input);
                setShowForm(false);
              } catch {
                setError("Failed to create event. Please try again.");
              }
            }}
          />
          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      <EventTable
        events={events ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
      />
    </div>
  );
}

export const Route = createFileRoute("/events")({
  component: EventsPage,
});
