import { describe, it, expect, beforeEach, vi } from "vitest";
import { getHealth } from "./health";

describe("getHealth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches Go health via GET /api/go/health/ready", async () => {
    const mockResponse = { status: "ok", timestamp: "2025-06-01T00:00:00Z" };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await getHealth("go");

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/go/health/ready",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("fetches Node health via GET /api/node/health/ready", async () => {
    const mockResponse = { status: "ok", timestamp: "2025-06-01T00:00:00Z" };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await getHealth("node");

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/node/health/ready",
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

    await expect(getHealth("go")).rejects.toMatchObject({
      status: 503,
    });
  });
});
