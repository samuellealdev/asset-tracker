import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth, AuthProvider } from "./AuthContext";

describe("AuthContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("starts with no token and not authenticated", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("reads token from localStorage on mount", () => {
    localStorage.setItem("auth_token", "stored-jwt");

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.token).toBe("stored-jwt");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("sets token and persists to localStorage on login", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.login("new-jwt");
    });

    expect(result.current.token).toBe("new-jwt");
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem("auth_token")).toBe("new-jwt");
  });

  it("clears token and localStorage on logout", () => {
    localStorage.setItem("auth_token", "stored-jwt");

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an AuthProvider",
    );
  });
});
