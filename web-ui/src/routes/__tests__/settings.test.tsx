import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import type { ReactNode } from "react";

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

import { SettingsPage } from "../settings";

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

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders the settings title", () => {
    render(<SettingsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it("displays API base URLs", () => {
    render(<SettingsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/api base urls/i)).toBeInTheDocument();
    expect(screen.getByText(/api\/go/i)).toBeInTheDocument();
    expect(screen.getByText(/api\/node/i)).toBeInTheDocument();
  });

  it("shows unauthenticated state when no token", () => {
    render(<SettingsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/not authenticated/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows token status when authenticated", () => {
    localStorage.setItem("auth_token", "test-jwt-token");
    render(<SettingsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/test-jwt-token/)).toBeInTheDocument();
  });

  it("calls logout and navigates to login when logout is clicked", async () => {
    localStorage.setItem("auth_token", "test-token");
    render(<SettingsPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });
});
