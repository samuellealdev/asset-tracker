import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth, AuthProvider } from "./AuthContext";

// Mock the auth API module (hoisted by vitest)
vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

// Import the mocked module after the mock declaration
import { login as apiLogin } from "@/lib/api/auth";

const mockApiLogin = vi.mocked(apiLogin);

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
    expect(result.current.isLoading).toBe(false);
  });

  it("reads token from localStorage on mount", () => {
    localStorage.setItem("auth_token", "stored-jwt");

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.token).toBe("stored-jwt");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("calls API and stores token on login", async () => {
    mockApiLogin.mockResolvedValueOnce({ token: "api-jwt" });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login("admin", "secret");
    });

    expect(mockApiLogin).toHaveBeenCalledWith("admin", "secret");
    expect(result.current.token).toBe("api-jwt");
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem("auth_token")).toBe("api-jwt");
  });

  it("reports isAuthenticated correctly based on token state", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Initially not authenticated
    expect(result.current.isAuthenticated).toBe(false);

    // After login it becomes authenticated
    mockApiLogin.mockResolvedValueOnce({ token: "jwt" });
    await act(async () => {
      await result.current.login("admin", "secret");
    });
    expect(result.current.isAuthenticated).toBe(true);

    // After logout it's no longer authenticated
    act(() => {
      result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("throws on API error and does not store token", async () => {
    const apiError = { status: 401, body: { error: "Invalid credentials" } };
    mockApiLogin.mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await expect(result.current.login("admin", "wrong")).rejects.toEqual(
        apiError,
      );
    });

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
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
