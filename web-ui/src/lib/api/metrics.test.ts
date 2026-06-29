import { describe, it, expect, beforeEach, vi } from "vitest";
import { getMetrics, getMetricsDetail } from "./metrics";

describe("getMetrics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Go metrics via GET /api/go/metrics", async () => {
    const mockMetrics = { uptime_seconds: 3600, requests_count: 42 };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockMetrics), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await getMetrics("go");

    expect(result).toEqual(mockMetrics);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/go/metrics",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("fetches Node metrics via GET /api/node/metrics", async () => {
    const mockMetrics = { uptime_seconds: 7200, events_processed: 99 };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockMetrics), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await getMetrics("node");

    expect(result).toEqual(mockMetrics);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/node/metrics",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws on non-OK response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(getMetrics("go")).rejects.toMatchObject({
      status: 503,
    });
  });

  it("throws TypeError when fetch itself fails (network error)", async () => {
    const mockFetch = vi.fn().mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(getMetrics("go")).rejects.toThrow(TypeError);
  });

  it("throws TypeError when response body is not JSON (proxy error page)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("<html>502 Bad Gateway</html>", { status: 502 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(getMetrics("go")).rejects.toThrow(TypeError);
  });
});

const mockRequestTrace = {
  method: "GET",
  path: "/api/devices",
  status: 200,
  duration_ms: 42.3,
  timestamp: "2026-06-29T14:30:00Z",
};

const mockMetricsDetail = {
  requests_total: 1042,
  errors_total: 7,
  recent: [mockRequestTrace],
};

describe("getMetricsDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Go service detail via GET /api/go/metrics/requests", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockMetricsDetail), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await getMetricsDetail("go");

    expect(result).toEqual(mockMetricsDetail);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/go/metrics/requests",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("fetches Node service detail via GET /api/node/metrics/requests", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockMetricsDetail), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await getMetricsDetail("node");

    expect(result).toEqual(mockMetricsDetail);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/node/metrics/requests",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("appends limit query param when opts.limit is provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockMetricsDetail), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await getMetricsDetail("go", { limit: 10 });

    expect(result).toEqual(mockMetricsDetail);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/go/metrics/requests?limit=10",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws TypeError when fetch itself fails (network error)", async () => {
    const mockFetch = vi.fn().mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(getMetricsDetail("go")).rejects.toThrow(TypeError);
  });

  it("throws {status, body} on non-OK response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(getMetricsDetail("go")).rejects.toMatchObject({
      status: 503,
    });
  });

  it("throws TypeError when response body is not valid JSON", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("<html>502 Bad Gateway</html>", { status: 502 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(getMetricsDetail("go")).rejects.toThrow(TypeError);
  });

  it("accepts an AbortSignal and aborts the request when signal fires", async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new TypeError("The user aborted a request."));
          });
        }),
    );
    vi.stubGlobal("fetch", mockFetch);

    setTimeout(() => controller.abort(), 0);

    await expect(
      getMetricsDetail("go", { signal: controller.signal }),
    ).rejects.toThrow(TypeError);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/go/metrics/requests",
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
