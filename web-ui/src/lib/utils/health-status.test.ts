import { describe, it, expect } from "vitest";
import { classifyHealth, type HealthStatus } from "./health-status";

describe("classifyHealth", () => {
  it("returns healthy when no error and status is ok", () => {
    const result = classifyHealth(false, { status: "ok" }, null);
    expect(result).toBe<HealthStatus>("healthy");
  });

  it("returns offline when error is a TypeError (network failure)", () => {
    const result = classifyHealth(
      true,
      undefined,
      new TypeError("fetch failed"),
    );
    expect(result).toBe<HealthStatus>("offline");
  });

  it("returns offline when error.message includes 'fetch' (cross-realm fallback)", () => {
    const result = classifyHealth(true, undefined, {
      message: "fetch failed",
    });
    expect(result).toBe<HealthStatus>("offline");
  });

  it("returns unhealthy when isError is true but error is not TypeError and no cached data", () => {
    const result = classifyHealth(true, undefined, {
      status: 503,
      body: {},
    });
    expect(result).toBe<HealthStatus>("unhealthy");
  });

  it("returns stale when isError is true and cached data exists", () => {
    const result = classifyHealth(
      true,
      { status: "ok" },
      new Error("timeout"),
    );
    expect(result).toBe<HealthStatus>("stale");
  });

  it("returns unhealthy when isError is true with Error instance and no data", () => {
    const result = classifyHealth(true, undefined, new Error("timeout"));
    expect(result).toBe<HealthStatus>("unhealthy");
  });
});
