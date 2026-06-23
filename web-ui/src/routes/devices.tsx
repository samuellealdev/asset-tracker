import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from "@/hooks/use-devices";
import { DeviceGrid } from "@/components/devices/DeviceGrid";
import { DeletedDevicesList } from "@/components/devices/DeletedDevicesList";
import { DeviceFormModal } from "@/components/devices/DeviceFormModal";
import { DeleteDialog } from "@/components/devices/DeleteDialog";
import { useState } from "react";

interface SelectedDevice {
  id: string;
  name: string;
}

export function DevicesPage() {
  const { pathname } = useLocation();
  const { data: devices, isLoading, isError, refetch } = useDevices();
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<SelectedDevice | null>(null);

  const targetDevice = deleteTarget
    ? devices?.find((d) => d.id === deleteTarget)
    : undefined;

  const fullEditingDevice = editingDevice
    ? devices?.find((d) => d.id === editingDevice.id)
    : undefined;

  // If a child route is active (not exactly /devices), render only the Outlet
  if (pathname !== "/devices") {
    return <Outlet />;
  }

  const handleEdit = (deviceId: string) => {
    const device = devices?.find((d) => d.id === deviceId);
    if (device) {
      setEditingDevice({ id: device.id, name: device.name });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Devices</h1>
        <button
          onClick={() => setShowCreateModal(true)}
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
        onEdit={handleEdit}
      />

      <DeletedDevicesList
        showDeleted={showDeleted}
        onToggle={() => setShowDeleted(!showDeleted)}
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

      <DeviceFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (input) => {
          await createDevice.mutateAsync(input);
          setShowCreateModal(false);
        }}
        isPending={createDevice.isPending}
      />

      <DeviceFormModal
        isOpen={!!editingDevice}
        onClose={() => setEditingDevice(null)}
        device={fullEditingDevice}
        onSubmit={async (input) => {
          if (editingDevice) {
            await updateDevice.mutateAsync({ id: editingDevice.id, ...input });
            setEditingDevice(null);
          }
        }}
        isPending={updateDevice.isPending}
      />

    </div>
  );
}

export const Route = createFileRoute("/devices")({
  component: DevicesPage,
});
