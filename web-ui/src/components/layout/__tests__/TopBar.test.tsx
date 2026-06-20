import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

import { TopBar } from "../TopBar";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("TopBar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("renders the app title 'ASSET TRACKER'", () => {
    render(<TopBar onSettingsClick={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("ASSET TRACKER")).toBeInTheDocument();
  });

  it("renders a settings gear button with accessible label", () => {
    render(<TopBar onSettingsClick={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByRole("button", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("calls onSettingsClick when gear button is clicked", async () => {
    const onSettingsClick = vi.fn();
    render(<TopBar onSettingsClick={onSettingsClick} />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /settings/i }));

    expect(onSettingsClick).toHaveBeenCalledTimes(1);
  });

  it("renders a logout button", () => {
    render(<TopBar onSettingsClick={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByRole("button", { name: /logout/i }),
    ).toBeInTheDocument();
  });

  it("calls logout and navigates to /login on logout click", async () => {
    localStorage.setItem("auth_token", "test-jwt");

    render(<TopBar onSettingsClick={() => {}} />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });
});
