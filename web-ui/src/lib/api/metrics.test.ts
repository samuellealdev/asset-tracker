import { describe, it, expect, beforeEach, vi } from "vitest";
import { getMetrics } from "./metrics";

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
});
