import { createFileRoute } from "@tanstack/react-router";

export function DashboardsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-300">Overview</h2>
        <p className="text-sm text-slate-400">
          Live service health and metrics are displayed in the top bar for
          quick reference. Use the Devices tab to manage your devices.
        </p>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/dashboards")({
  component: DashboardsPage,
});
