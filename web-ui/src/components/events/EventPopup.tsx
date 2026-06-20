import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/shared/Modal";
import { EventTimeline } from "@/components/events/EventTimeline";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
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

interface EventPopupProps {
  deviceId: string;
  deviceName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EventPopup({
  deviceId,
  deviceName,
  isOpen,
  onClose,
}: EventPopupProps) {
  const { data: events, isLoading, isError, refetch } = useEvents(deviceId);
  const createEvent = useCreateEvent();

  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [actor, setActor] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [formPending, setFormPending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Reset form when popup opens for a new device
  useEffect(() => {
    if (isOpen) {
      setType("");
      setName("");
      setActor("");
      setDescription("");
      setErrors({});
      setSuccessMsg("");
      setFormPending(false);
      setShowForm(false);
    }
  }, [isOpen, deviceId]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});
      setSuccessMsg("");

      const result = createEventSchema.safeParse({
        type,
        deviceId,
        name,
        actor: actor || undefined,
        description: description || undefined,
      });

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (!fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      setFormPending(true);
      try {
        await createEvent.mutateAsync(result.data);
        setType("");
        setName("");
        setDescription("");
        setSuccessMsg("Event created successfully");
        setShowForm(false);
      } catch {
        setErrors({ form: "Failed to create event. Please try again." });
      } finally {
        setFormPending(false);
      }
    },
    [type, deviceId, name, actor, description, createEvent],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Events for ${deviceName}`}>
      <div className="space-y-6">
        {/* Event Timeline section — scrollable */}
        <div className="overflow-y-auto max-h-[70vh]">
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm font-medium text-red-400">
                Failed to load events
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <EventTimeline events={events ?? []} isLoading={isLoading} />
          )}

          {/* Toggle button — always visible at bottom of timeline */}

        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          data-testid="add-event-toggle"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add New Event"}
        </button>

        {/* Divider + form section — conditionally rendered */}
        {showForm && (
          <div className="animate-fade-in">
            <div className="border-t border-slate-700 pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">

              {/* Device indicator (read-only) */}
              <div className="rounded-lg bg-slate-700/50 px-3 py-2 text-xs text-slate-400">
                Device: <span className="font-medium text-slate-200">{deviceName}</span>
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
                      onClick={() => setType(preset)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        type === preset
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
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Or type custom..."
                  className={`mt-2 block w-full rounded-lg border bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.type
                      ? "border-red-300"
                      : "border-slate-600"
                  }`}
                />
                {errors.type && (
                  <p className="mt-1 text-xs text-red-400">{errors.type}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="ev-name"
                  className="block text-xs font-medium text-slate-400 mb-1.5"
                >
                  Name
                </label>
                <input
                  id="ev-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Event name"
                  className={`block w-full rounded-lg border bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.name
                      ? "border-red-300"
                      : "border-slate-600"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Actor */}
              <div>
                <label
                  htmlFor="ev-actor"
                  className="block text-xs font-medium text-slate-400 mb-1.5"
                >
                  Actor
                </label>
                <input
                  id="ev-actor"
                  type="text"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="e.g. admin"
                  className="block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="ev-desc"
                  className="block text-xs font-medium text-slate-400 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="ev-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description (optional)"
                  className="block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Form-level error */}
              {errors.form && (
                <p className="text-xs text-red-400">{errors.form}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={formPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {formPending ? "Adding..." : "Add Event"}
              </button>
            </form>
          </div>
        </div>
        )}

        {/* Success feedback — always visible even after form closes */}
        {successMsg && (
          <p className="rounded-lg bg-green-900/30 px-3 py-2 text-xs font-medium text-green-300">
            {successMsg}
          </p>
        )}
      </div>
    </Modal>
  );
}
