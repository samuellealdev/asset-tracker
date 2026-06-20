import { useState, type ReactNode } from "react";
import { TopBar } from "./TopBar";
import { LiveMetrics } from "./LiveMetrics";
import { SettingsPanel } from "./SettingsPanel";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <TopBar onSettingsClick={() => setSettingsOpen(!settingsOpen)} />
      <LiveMetrics />
      <main className="flex-1 p-6">{children}</main>
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
