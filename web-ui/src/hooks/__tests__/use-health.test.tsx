import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useGoHealth, useNodeHealth } from "../use-health";

vi.mock("@/lib/api/health", () => ({
  getHealth: vi.fn(),
}));

import * as healthApi from "@/lib/api/health";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
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

  it("fetches Go service health on mount with default refetchInterval", async () => {
    vi.mocked(healthApi.getHealth).mockResolvedValueOnce(mockHealthResponse);

    const { result } = renderHook(() => useGoHealth(), {
      wrapper: createWrapper(createQueryClient()),
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
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("works with custom refetchInterval parameter", async () => {
    vi.mocked(healthApi.getHealth).mockResolvedValueOnce(mockHealthResponse);

    const { result } = renderHook(() => useGoHealth(2000), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockHealthResponse);
    expect(healthApi.getHealth).toHaveBeenCalledWith("go");
  });

  it("verifies default refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useGoHealth(), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["health", "go"] });
    expect(query).toBeDefined();

    // Cast to access internal options property
    const options = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(options.refetchInterval).toBe(30_000);
  });

  it("verifies custom refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useGoHealth(2000), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["health", "go"] });
    expect(query).toBeDefined();

    const options = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(options.refetchInterval).toBe(2000);
  });
});

describe("useNodeHealth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Node.js service health on mount with default refetchInterval", async () => {
    vi.mocked(healthApi.getHealth).mockResolvedValueOnce(mockHealthResponse);

    const { result } = renderHook(() => useNodeHealth(), {
      wrapper: createWrapper(createQueryClient()),
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
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("works with custom refetchInterval parameter", async () => {
    vi.mocked(healthApi.getHealth).mockResolvedValueOnce(mockHealthResponse);

    const { result } = renderHook(() => useNodeHealth(3000), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockHealthResponse);
    expect(healthApi.getHealth).toHaveBeenCalledWith("node");
  });

  it("verifies default refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useNodeHealth(), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["health", "node"] });
    expect(query).toBeDefined();

    const options = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(options.refetchInterval).toBe(30_000);
  });

  it("verifies custom refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useNodeHealth(3000), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["health", "node"] });
    expect(query).toBeDefined();

    const options = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(options.refetchInterval).toBe(3000);
  });
});
