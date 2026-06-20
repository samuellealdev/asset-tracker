import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useDevice, useUpdateDevice, useDeleteDevice } from "@/hooks/use-devices";
import { useEvents } from "@/hooks/use-events";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { DeleteDialog } from "@/components/devices/DeleteDialog";
import { EventTimeline } from "@/components/events/EventTimeline";

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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Device Detail</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-indigo-400 transition-all duration-200 hover:bg-indigo-900/30"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-900/30"
          >
            Delete
          </button>
        </div>
      </div>

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
        <h2 className="mb-4 text-xl font-bold text-slate-100">Event Timeline</h2>
        <EventTimeline events={events} />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/devices/$id")({
  component: DeviceDetailPage,
});
