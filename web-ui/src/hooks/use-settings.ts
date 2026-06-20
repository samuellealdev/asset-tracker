import { useState, useCallback } from "react";

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

export function useSettings() {
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

  return {
    healthInterval,
    metricsInterval,
    updateHealthInterval,
    updateMetricsInterval,
  } as const;
}
