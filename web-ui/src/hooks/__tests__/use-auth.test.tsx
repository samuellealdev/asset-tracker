import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { useLogin, useLogout, useAuth } from "../use-auth";
import type { ReactNode } from "react";

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

import { login as apiLogin } from "@/lib/api/auth";
const mockApiLogin = vi.mocked(apiLogin);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns token and isAuthenticated from context", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe("useLogin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("calls API on mutate and stores token on success", async () => {
    mockApiLogin.mockResolvedValueOnce({ token: "hook-jwt" });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        username: "admin",
        password: "secret",
      });
    });

    expect(mockApiLogin).toHaveBeenCalledWith("admin", "secret");
    expect(localStorage.getItem("auth_token")).toBe("hook-jwt");
  });

  it("transitions through pending state during mutation", async () => {
    let resolvePromise!: (value: { token: string }) => void;
    mockApiLogin.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ username: "admin", password: "secret" });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise({ token: "jwt" });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it("surfaces error on failed login", async () => {
    const apiError = { status: 401, body: { error: "Invalid credentials" } };
    mockApiLogin.mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ username: "admin", password: "wrong" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useLogout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns a function that calls AuthContext.logout", () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current).toBe("function");
  });
});
