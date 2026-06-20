import type { Event } from "@/lib/schemas/event";

interface EventTableProps {
  events: Event[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex h-12 animate-pulse items-center rounded-lg bg-slate-800 px-4"
        >
          <div className="h-4 w-24 rounded bg-slate-700" />
          <div className="ml-8 h-4 w-20 rounded bg-slate-700" />
          <div className="ml-8 h-4 w-32 rounded bg-slate-700" />
          <div className="ml-8 h-4 w-16 rounded bg-slate-700" />
          <div className="ml-auto h-4 w-40 rounded bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-full bg-slate-700 p-4">
        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-lg font-medium text-slate-400">No events found</p>
      <p className="text-sm text-slate-400">There are no events to display.</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-full bg-red-900/30 p-4">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-lg font-medium text-slate-300">Failed to load events.</p>
      <p className="text-sm text-slate-400">Retry?</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
        Retry
      </button>
    </div>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  let colorClass = "bg-slate-700 text-slate-300";
  if (type === "device.created") {
    colorClass = "bg-green-900/30 text-green-300";
  } else if (type === "device.updated") {
    colorClass = "bg-blue-900/30 text-blue-300";
  } else if (type === "device.deleted") {
    colorClass = "bg-red-900/30 text-red-300";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {type}
    </span>
  );
}

export function EventTable({ events, isLoading, isError, onRetry }: EventTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (events.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-sm">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
              Device
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
              Actor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {events.map((event, index) => (
            <tr
              key={event.id}
              className={`transition-colors duration-200 ${
                index % 2 === 0 ? "bg-transparent" : "bg-slate-800/50"
              } hover:bg-indigo-900/20`}
            >
              <td className="px-6 py-4">
                <EventTypeBadge type={event.type} />
              </td>
              <td className="px-6 py-4 text-sm text-slate-200">
                {event.deviceId}
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                {event.actor ?? "—"}
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                {event.description ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
