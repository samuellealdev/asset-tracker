import { createFileRoute } from "@tanstack/react-router";

function EventsPage() {
  return <div>Events</div>;
}

export const Route = createFileRoute("/events")({
  component: EventsPage,
});
