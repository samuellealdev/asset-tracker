import { createFileRoute, Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h1 className="mb-4 text-6xl font-bold text-slate-600">404</h1>
      <p className="mb-6 text-xl text-slate-400">Page not found</p>
      <Link
        to="/devices"
        className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        Go to Devices
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});
