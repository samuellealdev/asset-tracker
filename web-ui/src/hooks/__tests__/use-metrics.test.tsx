import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useGoMetrics, useNodeMetrics } from "../use-metrics";

vi.mock("@/lib/api/metrics", () => ({
  getMetrics: vi.fn(),
}));

import * as metricsApi from "@/lib/api/metrics";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const mockMetricsResponse = {
  requests_total: 1500,
  errors_total: 12,
  uptime_seconds: 86400,
};

describe("useGoMetrics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Go service metrics on mount", async () => {
    vi.mocked(metricsApi.getMetrics).mockResolvedValueOnce(mockMetricsResponse);

    const { result } = renderHook(() => useGoMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsResponse);
    expect(metricsApi.getMetrics).toHaveBeenCalledWith("go");
  });

  it("surfaces error when metrics fetch fails", async () => {
    const error = { status: 500, body: { error: "Internal error" } };
    vi.mocked(metricsApi.getMetrics).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useGoMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useNodeMetrics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Node.js service metrics on mount", async () => {
    vi.mocked(metricsApi.getMetrics).mockResolvedValueOnce(mockMetricsResponse);

    const { result } = renderHook(() => useNodeMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsResponse);
    expect(metricsApi.getMetrics).toHaveBeenCalledWith("node");
  });

  it("surfaces error when metrics fetch fails", async () => {
    const error = { status: 500, body: { error: "Internal error" } };
    vi.mocked(metricsApi.getMetrics).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useNodeMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
