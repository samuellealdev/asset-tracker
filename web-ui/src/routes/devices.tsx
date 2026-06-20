import { createFileRoute } from "@tanstack/react-router";

function DevicesPage() {
  return <div>Devices</div>;
}

export const Route = createFileRoute("/devices")({
  component: DevicesPage,
});
