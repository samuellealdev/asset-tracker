import { describe, it, expect } from "vitest";
import {
  loginRequestSchema,
  tokenResponseSchema,
  errorResponseSchema,
} from "./auth";

describe("loginRequestSchema", () => {
  it("accepts valid username and password", () => {
    const result = loginRequestSchema.safeParse({
      username: "admin",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = loginRequestSchema.safeParse({
      username: "",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginRequestSchema.safeParse({
      username: "admin",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = loginRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string types", () => {
    const result = loginRequestSchema.safeParse({
      username: 123,
      password: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("tokenResponseSchema", () => {
  it("accepts valid token response", () => {
    const result = tokenResponseSchema.safeParse({ token: "jwt.ey.abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toBe("jwt.ey.abc");
    }
  });

  it("rejects missing token field", () => {
    const result = tokenResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string token", () => {
    const result = tokenResponseSchema.safeParse({ token: 123 });
    expect(result.success).toBe(false);
  });
});

describe("errorResponseSchema", () => {
  it("accepts valid error response", () => {
    const result = errorResponseSchema.safeParse({ error: "Invalid credentials" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.error).toBe("Invalid credentials");
    }
  });

  it("rejects missing error field", () => {
    const result = errorResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
