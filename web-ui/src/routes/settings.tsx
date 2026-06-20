import { createFileRoute } from "@tanstack/react-router";

function SettingsPage() {
  return <div>Settings</div>;
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
