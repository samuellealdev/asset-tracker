import { useNavigate } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { formatDate, truncateId } from "@/lib/utils/format";

interface DeletedDeviceCardProps {
  name: string;
  deviceId: string;
  type?: string;
  timestamp: string;
}

export function DeletedDeviceCard({
  name,
  deviceId,
  type,
  timestamp,
}: DeletedDeviceCardProps) {
  const navigate = useNavigate();

  return (
    <div className="opacity-70 group rounded-lg border border-red-900/20 bg-slate-800/50 p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-lg font-semibold text-slate-300">
          {name}
        </h3>
        <span className="inline-flex shrink-0 items-center rounded-full bg-red-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
          Deleted
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {type && (
          <span className="inline-flex items-center rounded-full bg-indigo-900/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
            {type}
          </span>
        )}
        <span className="font-mono text-xs text-slate-600">
          {truncateId(deviceId)}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Deleted: {formatDate(timestamp)}
      </p>

      <div className="mt-4 flex items-center gap-1 border-t border-slate-700/50 pt-3">
        <button
          onClick={() =>
            navigate({ to: "/devices/$id", params: { id: deviceId } })
          }
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-all duration-200 hover:bg-slate-700"
          aria-label="Details"
        >
          <Info className="h-3.5 w-3.5" />
          Details
        </button>
      </div>
    </div>
  );
}
