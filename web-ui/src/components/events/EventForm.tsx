import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createEventSchema } from "@/lib/schemas/event";
import type { Device } from "@/lib/schemas/device";
import type { CreateEventInput } from "@/lib/schemas/event";

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

interface EventFormProps {
  devices: Device[];
  onSubmit: (input: CreateEventInput) => Promise<void>;
  isPending: boolean;
}

export function EventForm({ devices, onSubmit, isPending }: EventFormProps) {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [actor, setActor] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

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

    try {
      await onSubmit(result.data);
    } catch {
      // Error handling is done by the parent
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-slate-300"
        >
          Type
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {EVENT_TYPE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setType(preset)}
              className="bg-slate-700 text-slate-300 rounded-full px-3 py-1 text-xs font-medium cursor-pointer hover:bg-slate-600 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          id="type"
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          list="event-types"
          className={`mt-1 block w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.type
              ? "border-red-300 focus:border-red-500"
              : "border-slate-600 focus:border-indigo-500"
          }`}
          placeholder="e.g. maintenance, inspection, alert"
        />
        <datalist id="event-types">
          {EVENT_TYPE_PRESETS.map((preset) => (
            <option key={preset} value={preset} />
          ))}
        </datalist>
        {errors.type && (
          <p className="mt-1 text-sm text-red-400">{errors.type}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="deviceId"
          className="block text-sm font-medium text-slate-300"
        >
          Device
        </label>
        <select
          id="deviceId"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className={`mt-1 block w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.deviceId
              ? "border-red-300 focus:border-red-500"
              : "border-slate-600 focus:border-indigo-500"
          }`}
        >
          <option value="">Select device...</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
        {errors.deviceId && (
          <p className="mt-1 text-sm text-red-400">{errors.deviceId}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-300"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`mt-1 block w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.name
              ? "border-red-300 focus:border-red-500"
              : "border-slate-600 focus:border-indigo-500"
          }`}
          placeholder="Event name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="actor"
          className="block text-sm font-medium text-slate-300"
        >
          Actor
        </label>
        <input
          id="actor"
          type="text"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. admin"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-300"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Event description (optional)"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
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
              Creating...
            </>
          ) : (
            "Create Event"
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/events" })}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
