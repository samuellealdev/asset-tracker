import { describe, it, expect, beforeEach, vi } from "vitest";
import { login } from "./auth";

describe("login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs username and password to /auth/login and returns the token", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token: "my-jwt-token" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await login("admin", "secret");

    expect(result.token).toBe("my-jwt-token");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/go/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ username: "admin", password: "secret" }),
      }),
    );
  });

  it("throws on invalid credentials (401)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(login("admin", "wrong")).rejects.toMatchObject({
      status: 401,
    });
  });
});
