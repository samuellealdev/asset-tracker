import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import type { ReactNode } from "react";

// Mock the router — we don't need full routing for this test
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  createFileRoute: () => (config: any) => config,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock the auth API
vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

import { login as apiLogin } from "@/lib/api/auth";
const mockApiLogin = vi.mocked(apiLogin);

// Import the component after mocks
import { LoginPage } from "../login";

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

describe("LoginPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("renders username and password fields and submit button", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(
      screen.getByPlaceholderText(/username/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/password/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("calls login mutation on form submit", async () => {
    mockApiLogin.mockResolvedValueOnce({ token: "jwt" });

    render(<LoginPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/username/i), "admin");
    await user.type(screen.getByPlaceholderText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockApiLogin).toHaveBeenCalledWith("admin", "secret");
    });
  });

  it("redirects to /devices on successful login", async () => {
    mockApiLogin.mockResolvedValueOnce({ token: "jwt" });

    render(<LoginPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/username/i), "admin");
    await user.type(screen.getByPlaceholderText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/devices" });
    });
  });

  it("shows error message on failed login", async () => {
    mockApiLogin.mockRejectedValueOnce({
      status: 401,
      body: { error: "Invalid credentials" },
    });

    render(<LoginPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/username/i), "admin");
    await user.type(screen.getByPlaceholderText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("disables submit button while loading", async () => {
    // Never resolve the promise
    mockApiLogin.mockReturnValueOnce(new Promise(() => {}));

    render(<LoginPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/username/i), "admin");
    await user.type(screen.getByPlaceholderText(/password/i), "secret");

    // Find button by role before clicking, text will change to "Signing in..."
    const button = screen.getByRole("button");

    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});
