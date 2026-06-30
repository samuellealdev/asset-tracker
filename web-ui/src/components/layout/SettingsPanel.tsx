import { useEffect, useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/hooks/use-settings";
import { X, LogOut } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const {
    healthInterval,
    metricsInterval,
    updateHealthInterval,
    updateMetricsInterval,
  } = useSettings();

  const [editHealthInterval, setEditHealthInterval] = useState(healthInterval);
  const [editMetricsInterval, setEditMetricsInterval] = useState(metricsInterval);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Sync local edit state when saved values change externally
  useEffect(() => {
    setEditHealthInterval(healthInterval);
    setEditMetricsInterval(metricsInterval);
  }, [healthInterval, metricsInterval]);

  const handleSaveIntervals = () => {
    let valid = true;

    if (!Number.isFinite(editHealthInterval) || editHealthInterval < 1000) {
      setHealthError("Minimum 1000ms");
      valid = false;
    } else {
      setHealthError(null);
    }

    if (!Number.isFinite(editMetricsInterval) || editMetricsInterval < 1000) {
      setMetricsError("Minimum 1000ms");
      valid = false;
    } else {
      setMetricsError(null);
    }

    if (valid) {
      updateHealthInterval(editHealthInterval);
      updateMetricsInterval(editMetricsInterval);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        data-testid="settings-backdrop"
        className="absolute inset-0 bg-black/60 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div
        data-testid="settings-panel"
        className="absolute right-0 top-0 flex h-full w-80 flex-col bg-slate-800 shadow-xl transition-transform duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* API Base URLs */}
          <Section title="API Base URLs">
            <ApiUrlRow label="Go API" value="http://localhost:8080" />
            <ApiUrlRow label="Node API" value="http://localhost:3000" />
          </Section>

          {/* Polling Intervals */}
          <Section title="Polling Intervals">
            <div>
              <label
                htmlFor="health-interval"
                className="mb-1 block text-xs text-slate-400"
              >
                Health check every (ms)
              </label>
              <input
                id="health-interval"
                type="number"
                value={editHealthInterval}
                onChange={(e) => {
                  setEditHealthInterval(Number(e.target.value));
                  setHealthError(null);
                }}
                min={1000}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
              />
              {healthError && (
                <p className="mt-1 text-xs text-red-400" data-testid="health-interval-error">
                  {healthError}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Default: 2000ms</p>
            </div>
            <div>
              <label
                htmlFor="metrics-interval"
                className="mb-1 block text-xs text-slate-400"
              >
                Metrics refresh every (ms)
              </label>
              <input
                id="metrics-interval"
                type="number"
                value={editMetricsInterval}
                onChange={(e) => {
                  setEditMetricsInterval(Number(e.target.value));
                  setMetricsError(null);
                }}
                min={1000}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
              />
              {metricsError && (
                <p className="mt-1 text-xs text-red-400" data-testid="metrics-interval-error">
                  {metricsError}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Default: 5000ms</p>
            </div>
            <button
              onClick={handleSaveIntervals}
              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Save Intervals
            </button>
            {saved && (
              <p
                className="text-green-400 text-sm mt-2 transition-opacity duration-500"
                data-testid="save-success"
              >
                ✓ Settings saved
              </p>
            )}
          </Section>

          {/* Auth Status */}
          <Section title="Auth Status">
            {token ? (
              <div className="space-y-1">
                <p className="text-sm text-green-400">Authenticated</p>
                <p className="break-all font-mono text-xs text-slate-400">
                  {token.length > 20
                    ? `${token.slice(0, 5)}...${token.slice(-5)}`
                    : token}
                </p>
              </div>
            ) : (
              <p className="text-sm text-amber-400">Not authenticated</p>
            )}
          </Section>

          {/* Logout */}
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-medium text-slate-300">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ApiUrlRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <input
        type="text"
        readOnly
        value={value}
        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-300"
      />
    </div>
  );
}
