import type { Event } from "@/lib/schemas/event";

interface EventTimelineProps {
  events: Event[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="mt-1.5 flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-full bg-slate-700" />
          <div className="min-w-0 flex-1 animate-pulse rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-sm">
            <div className="mb-2 h-4 w-24 rounded bg-slate-700" />
            <div className="h-4 w-48 rounded bg-slate-700" />
            <div className="mt-2 h-3 w-32 rounded bg-slate-700" />
          </div>
        </div>
      ))}
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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {type}
    </span>
  );
}

export function EventTimeline({
  events,
  isLoading,
  isError,
  onRetry,
}: EventTimelineProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-slate-700 p-3">
          <svg
            className="h-6 w-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-400">
          Failed to load events
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-slate-700 p-3">
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500">
          No events for this device
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute bottom-0 left-[19px] top-0 w-0.5 bg-slate-700" />

      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative flex items-start gap-4">
            {/* Timeline dot */}
            <div className="relative z-10 mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-700">
              <div
                className={`h-3 w-3 rounded-full ${
                  event.type === "device.created"
                    ? "bg-green-500"
                    : event.type === "device.deleted"
                      ? "bg-red-500"
                      : "bg-blue-500"
                }`}
              />
            </div>

            {/* Event card */}
            <div className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <EventTypeBadge type={event.type} />
                <span className="shrink-0 text-xs text-slate-500">
                  {new Date(event.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100">{event.name}</p>
              {event.description && (
                <p className="mt-1 text-sm text-slate-400">
                  {event.description}
                </p>
              )}
              {event.actor && (
                <p className="mt-1 text-xs text-slate-500">
                  by {event.actor}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
