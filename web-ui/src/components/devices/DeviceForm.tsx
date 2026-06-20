import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createDeviceSchema } from "@/lib/schemas/device";
import type { Device, CreateDeviceInput } from "@/lib/schemas/device";

interface DeviceFormProps {
  device?: Device;
  onSubmit: (input: CreateDeviceInput) => Promise<void>;
  isPending: boolean;
}

export function DeviceForm({ device, onSubmit, isPending }: DeviceFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(device?.name ?? "");
  const [type, setType] = useState(device?.type ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!device;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = createDeviceSchema.safeParse({ name, type });
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
          htmlFor="name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.name
              ? "border-red-300 focus:border-red-500"
              : "border-slate-300 focus:border-indigo-500"
          }`}
          placeholder="Device name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-slate-700"
        >
          Type
        </label>
        <input
          id="type"
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.type
              ? "border-red-300 focus:border-red-500"
              : "border-slate-300 focus:border-indigo-500"
          }`}
          placeholder="e.g. laptop, server, network"
        />
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type}</p>
        )}
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
              {isEdit ? "Saving..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create Device"
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/devices" })}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
