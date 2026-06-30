import { useState, useCallback } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useDevice, useUpdateDevice, useDeleteDevice } from "@/hooks/use-devices";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { DeleteDialog } from "@/components/devices/DeleteDialog";
import { EventTimeline } from "@/components/events/EventTimeline";
import { Modal } from "@/components/shared/Modal";
import { createEventSchema } from "@/lib/schemas/event";

const EVENT_TYPE_PRESETS = [
  "maintenance",
  "inspection",
  "repair",
  "relocation",
  "decommissioned",
  "alert",
  "audit",
  "firmware-update",
] as const;

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-32 animate-pulse rounded bg-slate-700" />
      <div className="h-40 animate-pulse rounded-lg bg-slate-800" />
    </div>
  );
}

export function DeviceDetailPage() {
  const { id } = useParams({ from: "/devices/$id" });
  const navigate = useNavigate();
  const { data: device, isLoading, isError, refetch } = useDevice(id);
  const { data: events = [] } = useEvents(id);
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Event form state
  const createEvent = useCreateEvent();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventType, setEventType] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventActor, setEventActor] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
  const [eventPending, setEventPending] = useState(false);

  const resetEventForm = useCallback(() => {
    setEventType("");
    setEventName("");
    setEventActor("");
    setEventDescription("");
    setEventErrors({});
    setEventPending(false);
  }, []);

  const handleCreateEvent = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setEventErrors({});

      const result = createEventSchema.safeParse({
        type: eventType,
        deviceId: id,
        name: eventName,
        actor: eventActor || undefined,
        description: eventDescription || undefined,
      });

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (!fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setEventErrors(fieldErrors);
        return;
      }

      setEventPending(true);
      try {
        await createEvent.mutateAsync(result.data);
        resetEventForm();
        setShowCreateEvent(false);
      } catch {
        setEventErrors({ form: "Failed to create event. Please try again." });
      } finally {
        setEventPending(false);
      }
    },
    [eventType, id, eventName, eventActor, eventDescription, createEvent, resetEventForm],
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !device) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="rounded-full bg-red-900/30 p-4">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-300">Device not found</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setIsEditing(false)}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          &larr; Back to detail
        </button>
        <h1 className="text-2xl font-bold text-slate-100">Edit Device</h1>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <DeviceForm
            device={device}
            isPending={updateDevice.isPending}
            onSubmit={async (input) => {
              setError(null);
              try {
                await updateDevice.mutateAsync({ id: device.id, ...input });
                setIsEditing(false);
              } catch {
                setError("Failed to update device. Please try again.");
              }
            }}
          />
          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: "/devices" })}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        &larr; Back to devices
      </button>

      <h1 className="text-2xl font-bold text-slate-100">Device Detail</h1>

      <DeviceCard device={device} />

      <DeleteDialog
        deviceName={device.name}
        isOpen={showDeleteDialog}
        isPending={deleteDevice.isPending}
        onConfirm={async () => {
          try {
            await deleteDevice.mutateAsync(device.id);
            navigate({ to: "/devices" });
          } catch {
            setShowDeleteDialog(false);
          }
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">Event Timeline</h2>
          <button
            onClick={() => {
              resetEventForm();
              setShowCreateEvent(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-indigo-700"
          >
            New Event
          </button>
        </div>
        <EventTimeline events={events} />
      </div>

      <Modal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        title="Create Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          {/* Device indicator (read-only) */}
          <div className="rounded-lg bg-slate-700/50 px-3 py-2 text-xs text-slate-400">
            Device: <span className="font-medium text-slate-200">{device.name}</span>
          </div>

          {/* Type chips */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEventType(preset)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    eventType === preset
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="Or type custom..."
              className={`mt-2 block w-full rounded-lg border bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                eventErrors.type ? "border-red-300" : "border-slate-600"
              }`}
            />
            {eventErrors.type && (
              <p className="mt-1 text-xs text-red-400">{eventErrors.type}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="ev-name" className="block text-xs font-medium text-slate-400 mb-1.5">
              Name
            </label>
            <input
              id="ev-name"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name"
              className={`block w-full rounded-lg border bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                eventErrors.name ? "border-red-300" : "border-slate-600"
              }`}
            />
            {eventErrors.name && (
              <p className="mt-1 text-xs text-red-400">{eventErrors.name}</p>
            )}
          </div>

          {/* Actor */}
          <div>
            <label htmlFor="ev-actor" className="block text-xs font-medium text-slate-400 mb-1.5">
              Actor
            </label>
            <input
              id="ev-actor"
              type="text"
              value={eventActor}
              onChange={(e) => setEventActor(e.target.value)}
              placeholder="e.g. admin"
              className="block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="ev-desc" className="block text-xs font-medium text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              id="ev-desc"
              rows={2}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Event description (optional)"
              className="block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Form-level error */}
          {eventErrors.form && (
            <p className="text-xs text-red-400">{eventErrors.form}</p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateEvent(false)}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={eventPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {eventPending ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/devices/$id")({
  component: DeviceDetailPage,
});
