import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const DEFAULTS = {
  healthInterval: 2000,
  metricsInterval: 5000,
} as const;

const KEYS = {
  healthInterval: "healthInterval",
  metricsInterval: "metricsInterval",
} as const;

function readValue(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function isValid(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export interface SettingsContextValue {
  healthInterval: number;
  metricsInterval: number;
  updateHealthInterval: (ms: number) => void;
  updateMetricsInterval: (ms: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [healthInterval, setHealthInterval] = useState<number>(() =>
    readValue(KEYS.healthInterval, DEFAULTS.healthInterval),
  );
  const [metricsInterval, setMetricsInterval] = useState<number>(() =>
    readValue(KEYS.metricsInterval, DEFAULTS.metricsInterval),
  );

  const updateHealthInterval = useCallback((ms: number) => {
    if (!isValid(ms)) return;
    localStorage.setItem(KEYS.healthInterval, String(ms));
    setHealthInterval(ms);
  }, []);

  const updateMetricsInterval = useCallback((ms: number) => {
    if (!isValid(ms)) return;
    localStorage.setItem(KEYS.metricsInterval, String(ms));
    setMetricsInterval(ms);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ healthInterval, metricsInterval, updateHealthInterval, updateMetricsInterval }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
