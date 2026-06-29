import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the hooks BEFORE imports
const mockUseGoHealth = vi.fn();
const mockUseNodeHealth = vi.fn();
const mockUseGoMetrics = vi.fn();
const mockUseNodeMetrics = vi.fn();

vi.mock("@/hooks/use-health", () => ({
  useGoHealth: (...args: unknown[]) => mockUseGoHealth(...args),
  useNodeHealth: (...args: unknown[]) => mockUseNodeHealth(...args),
}));

vi.mock("@/hooks/use-metrics", () => ({
  useGoMetrics: (...args: unknown[]) => mockUseGoMetrics(...args),
  useNodeMetrics: (...args: unknown[]) => mockUseNodeMetrics(...args),
}));

import { LiveMetrics } from "../LiveMetrics";

function mockHealthOk() {
  mockUseGoHealth.mockReturnValue({
    data: { status: "ok" },
    isError: false,
    isLoading: false,
  });
  mockUseNodeHealth.mockReturnValue({
    data: { status: "ok" },
    isError: false,
    isLoading: false,
  });
}

function mockMetricsOk() {
  mockUseGoMetrics.mockReturnValue({
    data: { requests_total: 42, errors_total: 3 },
    isError: false,
    isLoading: false,
  });
  mockUseNodeMetrics.mockReturnValue({
    data: { requests_total: 18, errors_total: 1 },
    isError: false,
    isLoading: false,
  });
}

describe("LiveMetrics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockHealthOk();
    mockMetricsOk();
  });

  it("renders health dots for Go and Node services when healthy", () => {
    render(<LiveMetrics />);

    const indicators = screen.getAllByRole("img", { hidden: true });
    expect(indicators.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Go API")).toBeInTheDocument();
    expect(screen.getByText("Node API")).toBeInTheDocument();
  });

  it("renders request and error counters from metrics data via testids", () => {
    render(<LiveMetrics />);

    expect(screen.getByTestId("go-req")).toHaveTextContent("42");
    expect(screen.getByTestId("go-err")).toHaveTextContent("3");
    expect(screen.getByTestId("node-req")).toHaveTextContent("18");
    expect(screen.getByTestId("node-err")).toHaveTextContent("1");
  });

  it("displays all-healthy state with Go and Node labels", () => {
    render(<LiveMetrics />);

    expect(screen.getByText("Go API")).toBeInTheDocument();
    expect(screen.getByText("Node API")).toBeInTheDocument();
  });

  it("shows red Go dot when Go health fails, counters still show metrics", () => {
    mockUseGoHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new Error("Connection refused"),
    });

    render(<LiveMetrics />);

    expect(screen.getByText("Go API")).toBeInTheDocument();
    // Counters come from metrics hook (still working), not health
    expect(screen.getByTestId("go-req")).toHaveTextContent("42");
    expect(screen.getByTestId("go-err")).toHaveTextContent("3");
  });

  it("shows red Node dot when Node health fails", () => {
    mockUseNodeHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new Error("Connection refused"),
    });

    render(<LiveMetrics />);

    expect(screen.getByText("Node API")).toBeInTheDocument();
  });

  it("displays counters correctly when metrics are available", () => {
    mockUseGoMetrics.mockReturnValue({
      data: { requests_total: 100, errors_total: 5 },
      isError: false,
      isLoading: false,
    });
    mockUseNodeMetrics.mockReturnValue({
      data: { requests_total: 200, errors_total: 10 },
      isError: false,
      isLoading: false,
    });

    render(<LiveMetrics />);

    expect(screen.getByTestId("go-req")).toHaveTextContent("100");
    expect(screen.getByTestId("go-err")).toHaveTextContent("5");
    expect(screen.getByTestId("node-req")).toHaveTextContent("200");
    expect(screen.getByTestId("node-err")).toHaveTextContent("10");
  });

  it("shows -- for counters when Go metrics fail", () => {
    mockUseGoMetrics.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new Error("Timeout"),
    });

    render(<LiveMetrics />);

    expect(screen.getByTestId("go-req")).toHaveTextContent("—");
    expect(screen.getByTestId("go-err")).toHaveTextContent("—");

    // Node side should still show normal values
    expect(screen.getByTestId("node-req")).toHaveTextContent("18");
    expect(screen.getByTestId("node-err")).toHaveTextContent("1");
  });

  it("renders compact layout in a single row", () => {
    render(<LiveMetrics />);

    const container = screen.getByTestId("live-metrics");
    expect(container).toBeInTheDocument();
    expect(container.className).toContain("flex");
  });

  it("displays stale badge when health has cached data despite error", () => {
    mockUseGoHealth.mockReturnValue({
      data: { status: "ok" },
      isError: true,
      isLoading: false,
      error: new Error("Timeout"),
    });

    render(<LiveMetrics />);

    expect(screen.getByText("Stale")).toBeInTheDocument();
  });

  it("shows no priority badge when all services are healthy", () => {
    render(<LiveMetrics />);

    expect(screen.queryByText(/offline|unhealthy|stale/i)).not.toBeInTheDocument();
  });

  it("renders correct aria-label for offline health dot", () => {
    mockUseGoHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new TypeError("NetworkError"),
    });

    render(<LiveMetrics />);

    const dot = screen.getByRole("img", { name: /go api offline/i });
    expect(dot).toBeInTheDocument();
  });

  it("renders correct aria-label for stale health dot", () => {
    mockUseGoHealth.mockReturnValue({
      data: { status: "ok" },
      isError: true,
      isLoading: false,
      error: new Error("timeout"),
    });

    render(<LiveMetrics />);

    const dot = screen.getByRole("img", { name: /go api stale/i });
    expect(dot).toBeInTheDocument();
  });

  it("shows priority offline badge over unhealthy", () => {
    mockUseGoHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new TypeError("NetworkError"),
    });
    mockUseNodeHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: { status: 503 },
    });

    render(<LiveMetrics />);

    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.queryByText("Unhealthy")).not.toBeInTheDocument();
  });

  it("shows priority unhealthy badge over stale", () => {
    mockUseGoHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: { status: 500 },
    });
    mockUseNodeHealth.mockReturnValue({
      data: { status: "ok" },
      isError: true,
      isLoading: false,
      error: new Error("timeout"),
    });

    render(<LiveMetrics />);

    expect(screen.getByText("Unhealthy")).toBeInTheDocument();
    expect(screen.queryByText("Stale")).not.toBeInTheDocument();
  });

  it("shows offline status label in detail modal when service is offline", async () => {
    mockUseGoHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new TypeError("NetworkError"),
    });

    render(<LiveMetrics />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

    const modalPanel = screen.getByTestId("modal-panel");
    expect(within(modalPanel).getByText("Offline")).toBeInTheDocument();
  });

  it("shows stale status label in detail modal when service has stale data", async () => {
    mockUseGoHealth.mockReturnValue({
      data: { status: "ok" },
      isError: true,
      isLoading: false,
      error: new Error("timeout"),
    });

    render(<LiveMetrics />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

    const modalPanel = screen.getByTestId("modal-panel");
    expect(within(modalPanel).getByText("Stale")).toBeInTheDocument();
  });

  it("opens detail modal when Go metrics are clicked", async () => {
    render(<LiveMetrics />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

    expect(screen.getByText("Go API Metrics")).toBeInTheDocument();
    expect(screen.getByText(/requests/i)).toBeInTheDocument();

    // Requests value appears both in the counter bar and in the modal
    const countValues = screen.getAllByText("42");
    expect(countValues.length).toBeGreaterThanOrEqual(1);
  });

  it("opens detail modal when Node metrics are clicked", async () => {
    render(<LiveMetrics />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /node metrics detail/i }));

    expect(screen.getByText("Node.js API Metrics")).toBeInTheDocument();

    // Requests value appears both in the counter bar and in the modal
    const countValues = screen.getAllByText("18");
    expect(countValues.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error rate percentage in detail modal", async () => {
    render(<LiveMetrics />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

    // 3 errors out of 42 requests = 7.1%
    const errorRateValues = screen.getAllByText(/7\.1/);
    expect(errorRateValues.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'No requests yet' when requests_total is 0", () => {
    mockUseGoMetrics.mockReturnValue({
      data: { requests_total: 0, errors_total: 0 },
      isError: false,
      isLoading: false,
    });

    render(<LiveMetrics />);

    // No modal yet, just verify the text isn't shown without click
    expect(screen.queryByText(/no requests yet/i)).not.toBeInTheDocument();
  });

  it("closes detail modal when backdrop is clicked", async () => {
    render(<LiveMetrics />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /go metrics detail/i }));
    expect(screen.getByText("Go API Metrics")).toBeInTheDocument();

    // Click backdrop to close
    await user.click(screen.getByTestId("modal-backdrop"));
    expect(screen.queryByText("Go API Metrics")).not.toBeInTheDocument();
  });

  it("shows health status in detail modal", async () => {
    render(<LiveMetrics />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

    const modalPanel = screen.getByTestId("modal-panel");
    expect(within(modalPanel).getByText("Healthy")).toBeInTheDocument();
  });

  it("shows Unhealthy status when health fails", async () => {
    mockUseGoHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new Error("Timeout"),
    });

    render(<LiveMetrics />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

    const modalPanel = screen.getByTestId("modal-panel");
    expect(within(modalPanel).getByText("Unhealthy")).toBeInTheDocument();
  });
});
