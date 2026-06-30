import { describe, it, expect } from "vitest";
import { eventSchema, createEventSchema } from "./event";

describe("eventSchema", () => {
  it("accepts a valid event with all fields", () => {
    const result = eventSchema.safeParse({
      id: "event-001",
      type: "checkout",
      deviceId: "device-1",
      name: "Device checked out",
      timestamp: "2025-06-01T12:00:00Z",
      actor: "John Doe",
      description: "Checked out for maintenance",
    });
    expect(result.success).toBe(true);
  });

  it("accepts event with nullable actor and description", () => {
    const result = eventSchema.safeParse({
      id: "event-002",
      type: "checkin",
      deviceId: "device-2",
      name: "Device checked in",
      timestamp: "2025-06-01T13:00:00Z",
      actor: null,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts event with missing optional fields", () => {
    const result = eventSchema.safeParse({
      id: "event-003",
      type: "checkin",
      deviceId: "device-3",
      name: "Device checked in",
      timestamp: "2025-06-01T14:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects event missing id", () => {
    const result = eventSchema.safeParse({
      type: "checkout",
      deviceId: "device-1",
      name: "Checkout",
      timestamp: "2025-06-01T12:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects event missing name", () => {
    const result = eventSchema.safeParse({
      id: "event-001",
      type: "checkout",
      deviceId: "device-1",
      timestamp: "2025-06-01T12:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("createEventSchema", () => {
  it("accepts valid create payload", () => {
    const result = createEventSchema.safeParse({
      type: "checkout",
      deviceId: "device-1",
      name: "Checkout event",
    });
    expect(result.success).toBe(true);
  });

  it("accepts create payload with optional fields", () => {
    const result = createEventSchema.safeParse({
      type: "checkout",
      deviceId: "device-1",
      name: "Checkout event",
      actor: "John",
      description: "Optional description",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty type", () => {
    const result = createEventSchema.safeParse({
      type: "",
      deviceId: "device-1",
      name: "Checkout",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = createEventSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
