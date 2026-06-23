import { useNavigate } from "@tanstack/react-router";
import { Info, Pencil, Trash2 } from "lucide-react";
import type { Device } from "@/lib/schemas/device";

interface DeviceGridCardProps {
  device: Device;
  onDelete?: (id: string) => void;
  onEdit?: (deviceId: string) => void;
}

export function DeviceGridCard({
  device,
  onDelete,
  onEdit,
}: DeviceGridCardProps) {
  const navigate = useNavigate();

  return (
    <div className="group rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
      <h3 className="truncate text-lg font-semibold text-slate-100">{device.name}</h3>

      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
          {device.type}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Created: {new Date(device.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-4 flex items-center gap-1 border-t border-slate-700 pt-3">
        <button
          onClick={() =>
            navigate({ to: "/devices/$id", params: { id: device.id } })
          }
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
          aria-label="Details"
        >
          <Info className="h-3.5 w-3.5" />
          Details
        </button>
        {onEdit && (
          <button
            onClick={() => onEdit(device.id)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(device.id)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-400 transition-all duration-200 hover:bg-red-900/30"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
