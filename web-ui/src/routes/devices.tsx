import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useDevices } from "@/hooks/use-devices";
import { DeviceGrid } from "@/components/devices/DeviceGrid";
import { DeleteDialog } from "@/components/devices/DeleteDialog";
import { useState } from "react";
import { useDeleteDevice } from "@/hooks/use-devices";

export function DevicesPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: devices, isLoading, isError, refetch } = useDevices();
  const deleteDevice = useDeleteDevice();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const targetDevice = deleteTarget
    ? devices?.find((d) => d.id === deleteTarget)
    : undefined;

  // If a child route is active (not exactly /devices), render only the Outlet
  if (pathname !== "/devices") {
    return <Outlet />;
  }

  const handleViewEvents = (deviceId: string) => {
    // Placeholder for Phase 4 EventPopup
    console.log("View events for device:", deviceId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Devices</h1>
        <button
          onClick={() => navigate({ to: "/devices/create" })}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Device
        </button>
      </div>

      <DeviceGrid
        devices={devices ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onDelete={(id) => setDeleteTarget(id)}
        onViewEvents={handleViewEvents}
      />

      <DeleteDialog
        deviceName={targetDevice?.name ?? ""}
        isOpen={!!deleteTarget}
        isPending={deleteDevice.isPending}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteDevice.mutateAsync(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export const Route = createFileRoute("/devices")({
  component: DevicesPage,
});
