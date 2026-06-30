import { describe, it, expect, beforeEach, vi } from "vitest";
import { createApiClient } from "./client";

describe("ApiClient", () => {
  const baseUrl = "http://test-api";
  let client: ReturnType<typeof createApiClient>;

  beforeEach(() => {
    vi.restoreAllMocks();
    client = createApiClient({ baseUrl });
  });

  describe("base URL configuration", () => {
    it("uses the configured base URL for requests", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      await client.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api/test",
        expect.any(Object),
      );
    });

    it("defaults to empty string when no baseUrl is provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const defaultClient = createApiClient();
      await defaultClient.get("/test");

      expect(mockFetch).toHaveBeenCalledWith("/test", expect.any(Object));
    });
  });

  describe("Bearer token interceptor", () => {
    it("attaches Authorization header when token is provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const authedClient = createApiClient({ baseUrl, token: "my-jwt" });
      await authedClient.get("/secured");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer my-jwt",
        }),
      );
    });

    it("does not attach Authorization header when no token", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      await client.get("/public");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe("401 handling", () => {
    it("dispatches auth:logout custom event on 401 response", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const events: Event[] = [];
      const listener = (e: Event) => events.push(e);
      window.addEventListener("auth:logout", listener);

      await expect(client.get("/secured")).rejects.toThrow();
      expect(events).toHaveLength(1);

      window.removeEventListener("auth:logout", listener);
    });
  });

  describe("JSON parsing", () => {
    it("parses successful JSON responses", async () => {
      const data = { id: "1", name: "test" };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(data), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await client.get("/device");
      expect(result).toEqual(data);
    });

    it("throws ApiError on non-OK status with parsed error body", async () => {
      const errorBody = { error: "Not found" };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(errorBody), { status: 404 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      await expect(client.get("/device/999")).rejects.toMatchObject({
        status: 404,
        body: errorBody,
      });
    });
  });

  describe("HTTP methods", () => {
    it("sends GET request", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      await client.get("/devices");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("sends POST request with JSON body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "2" }), { status: 201 }),
      );
      vi.stubGlobal("fetch", mockFetch);
      const body = { name: "New Device", type: "laptop" };

      await client.post("/devices", body);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual(
        expect.objectContaining({ "Content-Type": "application/json" }),
      );
      expect(options.body).toBe(JSON.stringify(body));
    });

    it("sends PUT request with JSON body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      await client.put("/devices/1", { name: "Updated" });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("PUT");
    });

    it("sends DELETE request and returns null on 204", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 204 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await client.delete("/devices/1");
      expect(result).toBeNull();

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("DELETE");
    });
  });
});
