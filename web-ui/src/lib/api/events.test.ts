import { describe, it, expect, beforeEach, vi } from "vitest";
import { getEvents, createEvent } from "./events";
import type { Event, CreateEventInput } from "@/lib/schemas/event";

describe("events API", () => {
  const mockEvent: Event = {
    id: "evt-001",
    type: "checkout",
    deviceId: "d-1",
    name: "Device checked out",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "John Doe",
    description: "Checked out for maintenance",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    window.dispatchEvent = vi.fn();
  });

  describe("getEvents", () => {
    it("fetches events for a device via GET /events with deviceId query", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([mockEvent]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await getEvents("d-1", "test-token");

      expect(result).toEqual([mockEvent]);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/node/events?deviceId=d-1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("returns empty array when no events exist", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await getEvents("d-1", "test-token");
      expect(result).toEqual([]);
    });

    it("encodes the deviceId parameter", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      await getEvents("device/1", "test-token");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/node/events?deviceId=device%2F1",
        expect.any(Object),
      );
    });

    it("dispatches auth:logout on 401", async () => {
      const dispatchSpy = vi.fn();
      window.dispatchEvent = dispatchSpy;
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      );
      vi.stubGlobal("fetch", mockFetch);

      await expect(getEvents("d-1", "bad-token")).rejects.toThrow();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "auth:logout" }),
      );
    });
  });

  describe("createEvent", () => {
    it("creates an event via POST /events", async () => {
      const input: CreateEventInput = {
        type: "checkout",
        deviceId: "d-1",
        name: "Device checked out",
        actor: "John",
        description: "Checked out",
      };
      const created = { id: "evt-002", ...input, timestamp: "2025-06-01T13:00:00Z" };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(created), { status: 201 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await createEvent(input, "test-token");

      expect(result).toEqual(created);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/node/events",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
          body: JSON.stringify(input),
        }),
      );
    });

    it("dispatches auth:logout on 401", async () => {
      const dispatchSpy = vi.fn();
      window.dispatchEvent = dispatchSpy;
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      );
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        createEvent({ type: "checkout", deviceId: "d-1", name: "Test" }, "bad-token"),
      ).rejects.toThrow();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "auth:logout" }),
      );
    });
  });
});
