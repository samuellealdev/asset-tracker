import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkAuth } from "../__root";

vi.mock("@tanstack/react-router", () => ({
  createRootRoute: () => (config: any) => config,
  redirect: (opts: any) => {
    throw new Error("Redirecting to " + opts.to);
  },
  useLocation: () => ({ pathname: "/" }),
  Outlet: () => null,
}));

describe("checkAuth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("does not throw for /login when unauthenticated", () => {
    expect(() =>
      checkAuth({ location: { pathname: "/login" } }),
    ).not.toThrow();
  });

  it("redirects to /login when accessing protected route without token", () => {
    expect(() =>
      checkAuth({ location: { pathname: "/devices" } }),
    ).toThrow();
  });

  it("does not throw for protected routes when token exists", () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ sub: "123", exp: 9999999999 }));
    localStorage.setItem("auth_token", `${header}.${payload}.fakesig`);

    expect(() =>
      checkAuth({ location: { pathname: "/devices" } }),
    ).not.toThrow();
  });
});
