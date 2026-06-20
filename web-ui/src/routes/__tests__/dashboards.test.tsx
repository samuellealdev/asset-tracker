import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => config,
}));

const mockGoHealth = { status: "ok", timestamp: "2025-06-01T12:00:00Z", database: "connected" };
const mockNodeHealth = { status: "ok", timestamp: "2025-06-01T12:00:00Z", database: "connected" };
const mockGoMetrics = { requests_total: 1500, errors_total: 12, uptime_seconds: 86400 };
const mockNodeMetrics = { requests_total: 2500, errors_total: 3, uptime_seconds: 172800 };

let mockGoHealthError = false;
let mockNodeHealthError = false;
let mockGoMetricsError = false;
let mockNodeMetricsError = false;

vi.mock("@/hooks/use-health", () => ({
  useGoHealth: () => ({
    data: mockGoHealth,
    isLoading: false,
    isError: mockGoHealthError,
  }),
  useNodeHealth: () => ({
    data: mockNodeHealth,
    isLoading: false,
    isError: mockNodeHealthError,
  }),
}));

vi.mock("@/hooks/use-metrics", () => ({
  useGoMetrics: () => ({
    data: mockGoMetrics,
    isLoading: false,
    isError: mockGoMetricsError,
  }),
  useNodeMetrics: () => ({
    data: mockNodeMetrics,
    isLoading: false,
    isError: mockNodeMetricsError,
  }),
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
    mockGoHealthError = false;
    mockNodeHealthError = false;
    mockGoMetricsError = false;
    mockNodeMetricsError = false;
  });

  it("renders the dashboard title", () => {
    render(<DashboardsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it("renders health cards for both services", () => {
    render(<DashboardsPage />, { wrapper: createWrapper() });

    // Both names appear in HealthCard AND MetricsCard
    expect(screen.getAllByText("Go API").length).toBe(2);
    expect(screen.getAllByText("Node.js API").length).toBe(2);
    expect(screen.getByText(":8080")).toBeInTheDocument();
    expect(screen.getByText(":3000")).toBeInTheDocument();
  });

  it("renders metrics cards for both services", () => {
    render(<DashboardsPage />, { wrapper: createWrapper() });

    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("2,500")).toBeInTheDocument();
  });

  it("shows auto-refresh indicator", () => {
    render(<DashboardsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/auto.refresh/i)).toBeInTheDocument();
  });
});
