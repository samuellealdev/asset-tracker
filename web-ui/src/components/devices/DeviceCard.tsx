import { useNavigate } from "@tanstack/react-router";
import type { Device } from "@/lib/schemas/device";

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate({ to: "/devices/$id", params: { id: device.id } })
      }
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {device.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            ID: {device.id.length > 8 ? `${device.id.slice(0, 8)}...` : device.id}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          {device.type}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Created: {new Date(device.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
