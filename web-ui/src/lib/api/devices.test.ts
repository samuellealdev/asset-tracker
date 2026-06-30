import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDevices, getDevice, createDevice, updateDevice, deleteDevice } from "./devices";

describe("devices API", () => {
  const mockDevice = {
    id: "d-1",
    name: "MacBook Pro",
    type: "laptop",
    createdAt: "2025-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    // Stub window dispatchEvent for 401 tests
    window.dispatchEvent = vi.fn();
  });

  describe("getDevices", () => {
    it("fetches all devices via GET /devices", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([mockDevice]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await getDevices("test-token");

      expect(result).toEqual([mockDevice]);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/go/devices",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("returns empty array on empty list", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await getDevices("test-token");
      expect(result).toEqual([]);
    });
  });

  describe("getDevice", () => {
    it("fetches a single device by ID", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockDevice), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await getDevice("d-1", "test-token");

      expect(result).toEqual(mockDevice);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/go/devices/d-1",
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

      await expect(getDevice("d-1", "bad-token")).rejects.toThrow();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "auth:logout" }),
      );
    });
  });

  describe("createDevice", () => {
    it("creates a device via POST /devices", async () => {
      const newDevice = { name: "New Device", type: "server" };
      const created = { id: "d-2", ...newDevice, createdAt: "2025-06-01T00:00:00Z" };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(created), { status: 201 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await createDevice(newDevice, "test-token");

      expect(result).toEqual(created);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/go/devices",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(newDevice),
        }),
      );
    });
  });

  describe("updateDevice", () => {
    it("updates a device via PUT /devices/:id", async () => {
      const update = { name: "Updated Name" };
      const updated = { ...mockDevice, name: "Updated Name" };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(updated), { status: 200 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await updateDevice("d-1", update, "test-token");

      expect(result).toEqual(updated);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/go/devices/d-1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(update),
        }),
      );
    });
  });

  describe("deleteDevice", () => {
    it("deletes a device via DELETE /devices/:id", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 204 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const result = await deleteDevice("d-1", "test-token");

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/go/devices/d-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });
});
