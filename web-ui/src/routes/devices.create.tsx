import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCreateDevice } from "@/hooks/use-devices";
import { DeviceForm } from "@/components/devices/DeviceForm";

export function DeviceCreatePage() {
  const navigate = useNavigate();
  const createDevice = useCreateDevice();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: "/devices" })}
        className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
      >
        &larr; Back to devices
      </button>

      <h1 className="text-2xl font-bold text-slate-100">Create New Device</h1>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <DeviceForm
          isPending={createDevice.isPending}
          onSubmit={async (input) => {
            setError(null);
            try {
              await createDevice.mutateAsync(input);
              navigate({ to: "/devices" });
            } catch {
              setError("Failed to create device. Please try again.");
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

export const Route = createFileRoute("/devices/create")({
  component: DeviceCreatePage,
});
