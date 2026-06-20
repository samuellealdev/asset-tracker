import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();
const mockMatchRoute = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useMatchRoute: () => mockMatchRoute,
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

vi.mock("@/hooks/use-health", () => ({
  useGoHealth: () => ({ data: { status: "ok" }, isError: false, isLoading: false }),
  useNodeHealth: () => ({ data: { status: "ok" }, isError: false, isLoading: false }),
}));

vi.mock("@/hooks/use-metrics", () => ({
  useGoMetrics: () => ({ data: {}, isError: false, isLoading: false }),
  useNodeMetrics: () => ({ data: {}, isError: false, isLoading: false }),
}));

import { AppLayout } from "../AppLayout";
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

describe("AppLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
    mockMatchRoute.mockClear();
  });

  it("renders TopBar with app title and LiveMetrics", () => {
    render(
      <AppLayout>
        <div>Page content</div>
      </AppLayout>,
      { wrapper: createWrapper() },
    );

    // TopBar app title
    expect(screen.getByText("ASSET TRACKER")).toBeInTheDocument();

    // LiveMetrics
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.getByText("Node")).toBeInTheDocument();

    // Main content
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders a settings gear button that opens the SettingsPanel", async () => {
    render(
      <AppLayout>
        <div>Page content</div>
      </AppLayout>,
      { wrapper: createWrapper() },
    );

    // Settings panel should not be visible initially
    expect(screen.queryByTestId("settings-panel")).not.toBeInTheDocument();

    // Click the gear button
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /settings/i }));

    // Settings panel should now be visible
    expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
  });

  it("does not render Sidebar or hamburger toggle", () => {
    render(
      <AppLayout>
        <div>Page content</div>
      </AppLayout>,
      { wrapper: createWrapper() },
    );

    // Old sidebar items should NOT be present
    expect(screen.queryByText("Events")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();

    // No hamburger toggle
    expect(
      screen.queryByLabelText("Toggle menu"),
    ).not.toBeInTheDocument();
  });
});
