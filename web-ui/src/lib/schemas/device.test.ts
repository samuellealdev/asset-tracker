import { describe, it, expect } from "vitest";
import { deviceSchema, createDeviceSchema, updateDeviceSchema } from "./device";

describe("deviceSchema", () => {
  it("accepts a valid device object", () => {
    const result = deviceSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "MacBook Pro",
      type: "laptop",
      createdAt: "2025-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects device missing name", () => {
    const result = deviceSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "laptop",
      createdAt: "2025-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects device with empty name", () => {
    const result = deviceSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "",
      type: "laptop",
      createdAt: "2025-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects device with invalid createdAt", () => {
    const result = deviceSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "MacBook Pro",
      type: "laptop",
      createdAt: 12345,
    });
    expect(result.success).toBe(false);
  });
});

describe("createDeviceSchema", () => {
  it("accepts valid create payload", () => {
    const result = createDeviceSchema.safeParse({
      name: "New Device",
      type: "server",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createDeviceSchema.safeParse({
      name: "",
      type: "server",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty type", () => {
    const result = createDeviceSchema.safeParse({
      name: "New Device",
      type: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = createDeviceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateDeviceSchema", () => {
  it("accepts partial update with just name", () => {
    const result = updateDeviceSchema.safeParse({ name: "Renamed" });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with just type", () => {
    const result = updateDeviceSchema.safeParse({ type: "desktop" });
    expect(result.success).toBe(true);
  });

  it("accepts full update", () => {
    const result = updateDeviceSchema.safeParse({
      name: "Renamed",
      type: "desktop",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name in update", () => {
    const result = updateDeviceSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
