import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings, SettingsProvider } from "@/context/SettingsContext";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

describe("useSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default values when localStorage is empty", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.healthInterval).toBe(2000);
    expect(result.current.metricsInterval).toBe(5000);
  });

  it("reads existing values from localStorage", () => {
    localStorage.setItem("healthInterval", "3000");
    localStorage.setItem("metricsInterval", "7000");

    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.healthInterval).toBe(3000);
    expect(result.current.metricsInterval).toBe(7000);
  });

  it("updateHealthInterval writes to localStorage and updates returned value", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateHealthInterval(10000);
    });

    expect(result.current.healthInterval).toBe(10000);
    expect(localStorage.getItem("healthInterval")).toBe("10000");
  });

  it("updateMetricsInterval writes to localStorage and updates returned value", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateMetricsInterval(15000);
    });

    expect(result.current.metricsInterval).toBe(15000);
    expect(localStorage.getItem("metricsInterval")).toBe("15000");
  });

  it("ignores NaN value for healthInterval and keeps previous value", () => {
    localStorage.setItem("healthInterval", "3000");
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateHealthInterval(NaN);
    });

    expect(result.current.healthInterval).toBe(3000);
    expect(localStorage.getItem("healthInterval")).toBe("3000");
  });

  it("ignores NaN value for metricsInterval and keeps previous value", () => {
    localStorage.setItem("metricsInterval", "7000");
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateMetricsInterval(NaN);
    });

    expect(result.current.metricsInterval).toBe(7000);
    expect(localStorage.getItem("metricsInterval")).toBe("7000");
  });

  it("ignores negative value for healthInterval and keeps previous", () => {
    localStorage.setItem("healthInterval", "3000");
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateHealthInterval(-100);
    });

    expect(result.current.healthInterval).toBe(3000);
    expect(localStorage.getItem("healthInterval")).toBe("3000");
  });

  it("ignores negative value for metricsInterval and keeps previous", () => {
    localStorage.setItem("metricsInterval", "7000");
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateMetricsInterval(-50);
    });

    expect(result.current.metricsInterval).toBe(7000);
    expect(localStorage.getItem("metricsInterval")).toBe("7000");
  });

  it("ignores zero value for healthInterval and keeps previous", () => {
    localStorage.setItem("healthInterval", "3000");
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateHealthInterval(0);
    });

    expect(result.current.healthInterval).toBe(3000);
  });

  it("ignores zero value for metricsInterval and keeps previous", () => {
    localStorage.setItem("metricsInterval", "7000");
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateMetricsInterval(0);
    });

    expect(result.current.metricsInterval).toBe(7000);
  });
});
