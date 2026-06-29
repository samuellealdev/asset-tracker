import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useGoMetrics,
  useNodeMetrics,
  useGoMetricsDetail,
  useNodeMetricsDetail,
} from "../use-metrics";

vi.mock("@/lib/api/metrics", () => ({
  getMetrics: vi.fn(),
  getMetricsDetail: vi.fn(),
}));

import * as metricsApi from "@/lib/api/metrics";

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

const mockMetricsResponse = {
  requests_total: 1500,
  errors_total: 12,
  uptime_seconds: 86400,
};

describe("useGoMetrics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Go service metrics on mount with default refetchInterval", async () => {
    vi.mocked(metricsApi.getMetrics).mockResolvedValueOnce(mockMetricsResponse);

    const { result } = renderHook(() => useGoMetrics(), {
      wrapper: createWrapper(createQueryClient()),
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
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("works with custom refetchInterval parameter", async () => {
    vi.mocked(metricsApi.getMetrics).mockResolvedValueOnce(mockMetricsResponse);

    const { result } = renderHook(() => useGoMetrics(5000), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsResponse);
    expect(metricsApi.getMetrics).toHaveBeenCalledWith("go");
  });

  it("works with refetchInterval of 0 to disable polling", async () => {
    vi.mocked(metricsApi.getMetrics).mockResolvedValueOnce(mockMetricsResponse);

    const { result } = renderHook(() => useGoMetrics(0), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsResponse);
  });

  it("verifies default refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useGoMetrics(), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics", "go"] });
    expect(query).toBeDefined();
    const opts = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(opts.refetchInterval).toBe(30_000);
  });

  it("verifies custom refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useGoMetrics(5000), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics", "go"] });
    expect(query).toBeDefined();
    const opts = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(opts.refetchInterval).toBe(5000);
  });
});

describe("useNodeMetrics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Node.js service metrics on mount with default refetchInterval", async () => {
    vi.mocked(metricsApi.getMetrics).mockResolvedValueOnce(mockMetricsResponse);

    const { result } = renderHook(() => useNodeMetrics(), {
      wrapper: createWrapper(createQueryClient()),
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
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("works with custom refetchInterval parameter", async () => {
    vi.mocked(metricsApi.getMetrics).mockResolvedValueOnce(mockMetricsResponse);

    const { result } = renderHook(() => useNodeMetrics(10000), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsResponse);
    expect(metricsApi.getMetrics).toHaveBeenCalledWith("node");
  });

  it("verifies default refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useNodeMetrics(), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics", "node"] });
    expect(query).toBeDefined();
    const opts = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(opts.refetchInterval).toBe(30_000);
  });

  it("verifies custom refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useNodeMetrics(8000), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics", "node"] });
    expect(query).toBeDefined();
    const opts = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(opts.refetchInterval).toBe(8000);
  });
});

const mockMetricsDetailResponse = {
  requests_total: 1042,
  errors_total: 7,
  recent: [
    {
      method: "GET",
      path: "/api/devices",
      status: 200,
      duration_ms: 42.3,
      timestamp: "2026-06-29T14:30:00Z",
    },
  ],
};

describe("useGoMetricsDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Go service detail on mount with default refetchInterval", async () => {
    vi.mocked(metricsApi.getMetricsDetail).mockResolvedValueOnce(
      mockMetricsDetailResponse,
    );

    const { result } = renderHook(() => useGoMetricsDetail(), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsDetailResponse);
    expect(metricsApi.getMetricsDetail).toHaveBeenCalledWith("go");
  });

  it("surfaces error when detail fetch fails", async () => {
    const error = { status: 500, body: { error: "Internal error" } };
    vi.mocked(metricsApi.getMetricsDetail).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useGoMetricsDetail(), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("works with custom refetchInterval parameter", async () => {
    vi.mocked(metricsApi.getMetricsDetail).mockResolvedValueOnce(
      mockMetricsDetailResponse,
    );

    const { result } = renderHook(() => useGoMetricsDetail(5000), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsDetailResponse);
    expect(metricsApi.getMetricsDetail).toHaveBeenCalledWith("go");
  });

  it("verifies default refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useGoMetricsDetail(), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics-detail", "go"] });
    expect(query).toBeDefined();
    const opts = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(opts.refetchInterval).toBe(10_000);
  });

  it("verifies custom refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useGoMetricsDetail(5000), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics-detail", "go"] });
    expect(query).toBeDefined();
    const opts = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(opts.refetchInterval).toBe(5000);
  });

  it("uses distinct cache keys from aggregate metrics queries", () => {
    const queryClient = createQueryClient();

    renderHook(() => useGoMetricsDetail(), {
      wrapper: createWrapper(queryClient),
    });

    const detailQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics-detail", "go"] });
    const aggQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics", "go"] });

    expect(detailQuery).toBeDefined();
    expect(aggQuery).toBeUndefined();
  });
});

describe("useNodeMetricsDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Node service detail on mount with default refetchInterval", async () => {
    vi.mocked(metricsApi.getMetricsDetail).mockResolvedValueOnce(
      mockMetricsDetailResponse,
    );

    const { result } = renderHook(() => useNodeMetricsDetail(), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsDetailResponse);
    expect(metricsApi.getMetricsDetail).toHaveBeenCalledWith("node");
  });

  it("surfaces error when detail fetch fails", async () => {
    const error = { status: 500, body: { error: "Internal error" } };
    vi.mocked(metricsApi.getMetricsDetail).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useNodeMetricsDetail(), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("works with custom refetchInterval parameter", async () => {
    vi.mocked(metricsApi.getMetricsDetail).mockResolvedValueOnce(
      mockMetricsDetailResponse,
    );

    const { result } = renderHook(() => useNodeMetricsDetail(8000), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMetricsDetailResponse);
    expect(metricsApi.getMetricsDetail).toHaveBeenCalledWith("node");
  });

  it("verifies default refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useNodeMetricsDetail(), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics-detail", "node"] });
    expect(query).toBeDefined();
    const opts = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(opts.refetchInterval).toBe(10_000);
  });

  it("verifies custom refetchInterval via query observer options", () => {
    const queryClient = createQueryClient();

    renderHook(() => useNodeMetricsDetail(8000), {
      wrapper: createWrapper(queryClient),
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics-detail", "node"] });
    expect(query).toBeDefined();
    const opts = (query as unknown as { options: Record<string, unknown> })
      .options;
    expect(opts.refetchInterval).toBe(8000);
  });

  it("uses distinct cache keys from aggregate metrics queries", () => {
    const queryClient = createQueryClient();

    renderHook(() => useNodeMetricsDetail(), {
      wrapper: createWrapper(queryClient),
    });

    const detailQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics-detail", "node"] });
    const aggQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ["metrics", "node"] });

    expect(detailQuery).toBeDefined();
    expect(aggQuery).toBeUndefined();
  });
});
