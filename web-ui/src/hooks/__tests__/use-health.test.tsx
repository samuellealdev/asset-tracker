import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useGoHealth, useNodeHealth } from "../use-health";

vi.mock("@/lib/api/health", () => ({
  getHealth: vi.fn(),
}));

import * as healthApi from "@/lib/api/health";

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

const mockHealthResponse = {
  status: "ok",
  timestamp: "2025-06-01T12:00:00Z",
  database: "connected",
};

describe("useGoHealth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Go service health on mount", async () => {
    vi.mocked(healthApi.getHealth).mockResolvedValueOnce(mockHealthResponse);

    const { result } = renderHook(() => useGoHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockHealthResponse);
    expect(healthApi.getHealth).toHaveBeenCalledWith("go");
  });

  it("surfaces error when health check fails", async () => {
    const error = { status: 503, body: { error: "Service unavailable" } };
    vi.mocked(healthApi.getHealth).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useGoHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useNodeHealth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Node.js service health on mount", async () => {
    vi.mocked(healthApi.getHealth).mockResolvedValueOnce(mockHealthResponse);

    const { result } = renderHook(() => useNodeHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockHealthResponse);
    expect(healthApi.getHealth).toHaveBeenCalledWith("node");
  });

  it("surfaces error when health check fails", async () => {
    const error = { status: 503, body: { error: "Service unavailable" } };
    vi.mocked(healthApi.getHealth).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useNodeHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
