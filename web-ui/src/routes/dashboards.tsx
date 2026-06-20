import { createFileRoute } from "@tanstack/react-router";

function DashboardsPage() {
  return <div>Dashboards</div>;
}

export const Route = createFileRoute("/dashboards")({
  component: DashboardsPage,
});
