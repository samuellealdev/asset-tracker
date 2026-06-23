import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => config,
}));

vi.mock("@/components/devices/DeletedDevicesList", () => ({
  DeletedDevicesList: () => <div data-testid="deleted-devices">Deleted Devices</div>,
}));

import { DashboardsPage } from "../dashboards";

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
        {children}
      </QueryClientProvider>
    );
  };
}

describe("DashboardsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the dashboard title", () => {
    render(<DashboardsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it("shows an overview message about live metrics being in the top bar", () => {
    render(<DashboardsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/overview/i)).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("Live service health") && content.includes("metrics"),
      ),
    ).toBeInTheDocument();
  });
});
