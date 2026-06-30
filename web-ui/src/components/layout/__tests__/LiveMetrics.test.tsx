import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the hooks BEFORE imports
const mockUseGoHealth = vi.fn();
const mockUseNodeHealth = vi.fn();
const mockUseGoMetrics = vi.fn();
const mockUseNodeMetrics = vi.fn();
const mockUseGoMetricsDetail = vi.fn();
const mockUseNodeMetricsDetail = vi.fn();

vi.mock("@/hooks/use-health", () => ({
  useGoHealth: (...args: unknown[]) => mockUseGoHealth(...args),
  useNodeHealth: (...args: unknown[]) => mockUseNodeHealth(...args),
}));

vi.mock("@/hooks/use-metrics", () => ({
  useGoMetrics: (...args: unknown[]) => mockUseGoMetrics(...args),
  useNodeMetrics: (...args: unknown[]) => mockUseNodeMetrics(...args),
  useGoMetricsDetail: (...args: unknown[]) => mockUseGoMetricsDetail(...args),
  useNodeMetricsDetail: (...args: unknown[]) => mockUseNodeMetricsDetail(...args),
}));

vi.mock("@/hooks/use-settings", () => ({
  useSettings: () => ({
    healthInterval: 2000,
    metricsInterval: 5000,
    updateHealthInterval: vi.fn(),
    updateMetricsInterval: vi.fn(),
  }),
}));

import { LiveMetrics } from "../LiveMetrics";
import { applyFilters, countActiveFilters, type FilterState } from "../TraceTable";

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

const sampleTrace = (overrides = {}) => ({
  method: "GET",
  path: "/api/devices",
  status: 200,
  duration_ms: 42.3,
  timestamp: "2026-06-29T14:30:00Z",
  ...overrides,
});

const sampleTraces = [
  sampleTrace({ method: "GET", path: "/api/devices", status: 200, duration_ms: 10.1 }),
  sampleTrace({ method: "POST", path: "/api/devices", status: 201, duration_ms: 23.4 }),
  sampleTrace({ method: "DELETE", path: "/api/devices/1", status: 204, duration_ms: 5.0 }),
  sampleTrace({ method: "PUT", path: "/api/devices/1", status: 400, duration_ms: 15.2 }),
  sampleTrace({ method: "GET", path: "/api/events", status: 500, duration_ms: 100.7 }),
  sampleTrace({ method: "POST", path: "/api/auth/login", status: 200, duration_ms: 3.2 }),
  sampleTrace({ method: "GET", path: "/api/health", status: 200, duration_ms: 1.1 }),
  sampleTrace({ method: "PUT", path: "/api/devices/2", status: 200, duration_ms: 8.9 }),
  sampleTrace({ method: "DELETE", path: "/api/events/99", status: 404, duration_ms: 2.3 }),
  sampleTrace({ method: "GET", path: "/api/metrics", status: 200, duration_ms: 0.8 }),
  sampleTrace({ method: "POST", path: "/api/events", status: 500, duration_ms: 55.0 }),
  sampleTrace({ method: "GET", path: "/api/settings", status: 403, duration_ms: 4.1 }),
  sampleTrace({ method: "PATCH", path: "/api/devices/3", status: 200, duration_ms: 7.7 }),
  sampleTrace({ method: "GET", path: "/api/users", status: 200, duration_ms: 12.5 }),
  sampleTrace({ method: "POST", path: "/api/users", status: 409, duration_ms: 1.9 }),
];

function mockDetailOk(traces = sampleTraces) {
  mockUseGoMetricsDetail.mockReturnValue({
    data: { requests_total: 42, errors_total: 3, recent: traces },
    isError: false,
    isLoading: false,
  });
  mockUseNodeMetricsDetail.mockReturnValue({
    data: { requests_total: 18, errors_total: 1, recent: traces },
    isError: false,
    isLoading: false,
  });
}

// ── Phase 1: Unit tests for pure filter functions ──

describe("applyFilters", () => {
  const defaultFilters: FilterState = { method: "ALL", errorsOnly: false, pathSearch: "" };

  it("returns all traces when no filters are active", () => {
    const result = applyFilters(sampleTraces, defaultFilters);
    expect(result).toHaveLength(15);
  });

  it("filters by method (GET only)", () => {
    const filters: FilterState = { method: "GET", errorsOnly: false, pathSearch: "" };
    const result = applyFilters(sampleTraces, filters);
    expect(result).toHaveLength(6);
    result.forEach((t) => expect(t.method).toBe("GET"));
  });

  it("switches method filter from POST to DELETE", () => {
    const postFilters: FilterState = { method: "POST", errorsOnly: false, pathSearch: "" };
    expect(applyFilters(sampleTraces, postFilters)).toHaveLength(4);

    const deleteFilters: FilterState = { method: "DELETE", errorsOnly: false, pathSearch: "" };
    const result = applyFilters(sampleTraces, deleteFilters);
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.method).toBe("DELETE"));
  });

  it("filters errors only (status >= 400)", () => {
    const filters: FilterState = { method: "ALL", errorsOnly: true, pathSearch: "" };
    const result = applyFilters(sampleTraces, filters);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((t) => expect(t.status).toBeGreaterThanOrEqual(400));
  });

  it("filters by path substring (case-insensitive)", () => {
    const filters: FilterState = { method: "ALL", errorsOnly: false, pathSearch: "users" };
    const result = applyFilters(sampleTraces, filters);
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.path.toLowerCase()).toContain("users"));
  });

  it("combines method + errorsOnly filters", () => {
    const filters: FilterState = { method: "POST", errorsOnly: true, pathSearch: "" };
    const result = applyFilters(sampleTraces, filters);
    // POST traces with status >= 400: POST /api/events (500), POST /api/users (409)
    expect(result).toHaveLength(2);
    result.forEach((t) => {
      expect(t.method).toBe("POST");
      expect(t.status).toBeGreaterThanOrEqual(400);
    });
  });

  it("combines all three filters", () => {
    const filters: FilterState = { method: "POST", errorsOnly: true, pathSearch: "users" };
    const result = applyFilters(sampleTraces, filters);
    // POST /api/users (status 409) — matches method=POST, errorsOnly, path contains "users"
    expect(result).toHaveLength(1);
    expect(result[0]!.path).toBe("/api/users");
    expect(result[0]!.status).toBe(409);
  });

  it("returns empty array when no traces match", () => {
    const filters: FilterState = { method: "DELETE", errorsOnly: true, pathSearch: "nonexistent" };
    const result = applyFilters(sampleTraces, filters);
    expect(result).toHaveLength(0);
  });

  it("handles empty traces array", () => {
    const filters: FilterState = { method: "ALL", errorsOnly: false, pathSearch: "" };
    const result = applyFilters([], filters);
    expect(result).toHaveLength(0);
  });

  it("performs case-insensitive path match", () => {
    const traces = [
      { method: "GET", path: "/API/Users", status: 200, duration_ms: 1, timestamp: "2026-01-01T00:00:00Z" },
      { method: "GET", path: "/api/users", status: 200, duration_ms: 1, timestamp: "2026-01-01T00:00:00Z" },
    ];
    const filters: FilterState = { method: "ALL", errorsOnly: false, pathSearch: "USERS" };
    const result = applyFilters(traces, filters);
    expect(result).toHaveLength(2);
  });

  it("empty path search returns all matching by other filters", () => {
    const filters: FilterState = { method: "GET", errorsOnly: false, pathSearch: "" };
    const result = applyFilters(sampleTraces, filters);
    expect(result).toHaveLength(6);
  });
});

describe("countActiveFilters", () => {
  it("returns 0 when all filters are at defaults", () => {
    const filters: FilterState = { method: "ALL", errorsOnly: false, pathSearch: "" };
    expect(countActiveFilters(filters)).toBe(0);
  });

  it("returns 1 when method filter is active", () => {
    const filters: FilterState = { method: "POST", errorsOnly: false, pathSearch: "" };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("returns 1 when errorsOnly is active", () => {
    const filters: FilterState = { method: "ALL", errorsOnly: true, pathSearch: "" };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("returns 1 when pathSearch is non-empty", () => {
    const filters: FilterState = { method: "ALL", errorsOnly: false, pathSearch: "api" };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("returns 2 when method + errorsOnly are active", () => {
    const filters: FilterState = { method: "POST", errorsOnly: true, pathSearch: "" };
    expect(countActiveFilters(filters)).toBe(2);
  });

  it("returns 3 when all three filters are active", () => {
    const filters: FilterState = { method: "DELETE", errorsOnly: true, pathSearch: "api" };
    expect(countActiveFilters(filters)).toBe(3);
  });

  it("counts pathSearch with whitespace as active", () => {
    const filters: FilterState = { method: "ALL", errorsOnly: false, pathSearch: " " };
    expect(countActiveFilters(filters)).toBe(1);
  });
});

// ── End Phase 1 unit tests ──

describe("LiveMetrics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockHealthOk();
    mockMetricsOk();
    mockDetailOk();
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

    const modalPanel = screen.getByTestId("modal-panel");
    expect(screen.getByText("Go API Metrics")).toBeInTheDocument();
    expect(within(modalPanel).getByText(/^requests$/i)).toBeInTheDocument();

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

  describe("trace table", () => {
    it("renders trace table with 15 traces when detail modal is open", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).getByText("Recent Requests")).toBeInTheDocument();
      // 15 trace rows should be rendered (within the table body)
      const rows = within(modalPanel).getAllByRole("row");
      // 1 header row + 15 data rows = 16 rows
      expect(rows.length).toBe(16);
    });

    it("shows column headers: Method, Path, Status, Duration, Timestamp", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).getByText("Method")).toBeInTheDocument();
      expect(within(modalPanel).getByText("Path")).toBeInTheDocument();
      expect(within(modalPanel).getByText("Status")).toBeInTheDocument();
      expect(within(modalPanel).getByText("Duration")).toBeInTheDocument();
      expect(within(modalPanel).getByText("Timestamp")).toBeInTheDocument();
    });

    it("renders method badge with correct color for GET (blue)", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const getBadges = within(modalPanel).getAllByText("GET");
      // Filter out the filter-bar button, keep only the MethodBadge span
      const badge = getBadges.find((b) => b.className.includes("font-mono"));
      expect(badge?.className).toContain("text-blue-400");
    });

    it("renders method badge with correct color for POST (green)", async () => {
      mockDetailOk([
        sampleTrace({ method: "POST", path: "/test", status: 201, duration_ms: 10 }),
      ]);

      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const postBadges = within(modalPanel).getAllByText("POST");
      const badge = postBadges.find((b) => b.className.includes("font-mono"));
      expect(badge?.className).toContain("text-green-400");
    });

    it("renders method badge with correct color for DELETE (red)", async () => {
      mockDetailOk([
        sampleTrace({ method: "DELETE", path: "/test", status: 204, duration_ms: 5 }),
      ]);

      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const deleteBadges = within(modalPanel).getAllByText("DELETE");
      const badge = deleteBadges.find((b) => b.className.includes("font-mono"));
      expect(badge?.className).toContain("text-red-400");
    });

    it("renders method badge with correct color for PUT (amber)", async () => {
      mockDetailOk([
        sampleTrace({ method: "PUT", path: "/test", status: 200, duration_ms: 8 }),
      ]);

      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const putBadges = within(modalPanel).getAllByText("PUT");
      const badge = putBadges.find((b) => b.className.includes("font-mono"));
      expect(badge?.className).toContain("text-amber-400");
    });

    it("shows status 200 in green text color", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const status200s = within(modalPanel).getAllByText("200");
      expect(status200s.length).toBeGreaterThanOrEqual(1);
      expect(status200s[0]!.className).toContain("text-green-400");
    });

    it("shows status 500 in red text color", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const status500s = within(modalPanel).getAllByText("500");
      expect(status500s.length).toBeGreaterThanOrEqual(1);
      expect(status500s[0]!.className).toContain("text-red-400");
    });

    it("applies red left border to error rows (status >= 400)", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");

      // Row with status 500 should have the error background class
      const errorRows = within(modalPanel).getAllByText(/^[45]\d{2}$/);
      for (const cell of errorRows) {
        const row = cell.closest("tr");
        expect(row?.className).toContain("bg-red-950/20");
      }
    });

    it("wraps table in a scroll container with max-h-48 overflow-y-auto", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const scrollContainer = within(modalPanel).getByTestId("trace-scroll-container");
      expect(scrollContainer.className).toContain("max-h-48");
      expect(scrollContainer.className).toContain("overflow-y-auto");
    });

    it("shows 'No recent requests' when there are no traces", async () => {
      mockDetailOk([]);

      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).getByText("No recent requests")).toBeInTheDocument();
    });

    it("shows loading skeleton when detail query is loading and has no data", async () => {
      mockUseGoMetricsDetail.mockReturnValue({
        data: undefined,
        isError: false,
        isLoading: true,
      });

      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).getByText("Loading traces...")).toBeInTheDocument();
    });

    it("shows error message when detail query fails with no cached data", async () => {
      mockUseGoMetricsDetail.mockReturnValue({
        data: undefined,
        isError: true,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).getByText("Failed to load trace details")).toBeInTheDocument();
    });

    it("shows duration formatted as X.Xms", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).getByText("10.1ms")).toBeInTheDocument();
      expect(within(modalPanel).getByText("100.7ms")).toBeInTheDocument();
    });

    it("shows trace table for Node service when Node modal is opened", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /node metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).getByText("Recent Requests")).toBeInTheDocument();
      const rows = within(modalPanel).getAllByRole("row");
      expect(rows.length).toBe(16);
    });

    // ── Phase 2: Filter bar integration tests ──

    it("renders filter bar with method chips, error toggle, and path input", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const filterBar = within(modalPanel).getByTestId("filter-bar");
      expect(filterBar).toBeInTheDocument();

      // All 5 method chips present
      for (const method of ["ALL", "GET", "POST", "PUT", "DELETE"]) {
        expect(within(filterBar).getByTestId(`method-chip-${method}`)).toBeInTheDocument();
      }

      // Error toggle and path search
      expect(within(filterBar).getByTestId("error-toggle")).toBeInTheDocument();
      expect(within(filterBar).getByTestId("path-search")).toBeInTheDocument();
    });

    it("filters rows when method chip is clicked", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");

      // Click POST chip — should show 4 POST traces
      await user.click(within(modalPanel).getByTestId("method-chip-POST"));
      let rows = within(modalPanel).getAllByRole("row");
      // 1 header + 4 data rows = 5 rows
      expect(rows.length).toBe(5);

      // Click POST again (deselect) — all 15 traces
      await user.click(within(modalPanel).getByTestId("method-chip-POST"));
      rows = within(modalPanel).getAllByRole("row");
      expect(rows.length).toBe(16);
    });

    it("switches method filter when different chip is clicked", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");

      // Click POST → 5 rows
      await user.click(within(modalPanel).getByTestId("method-chip-POST"));
      expect(within(modalPanel).getAllByRole("row").length).toBe(5);

      // Click DELETE → 3 rows (header + 2 DELETE traces)
      await user.click(within(modalPanel).getByTestId("method-chip-DELETE"));
      expect(within(modalPanel).getAllByRole("row").length).toBe(3);
    });

    it("filters errors only when error toggle is active", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");

      // Click error toggle
      await user.click(within(modalPanel).getByTestId("error-toggle"));

      // 1 header + 6 error rows (status >= 400) = 7 rows
      const rows = within(modalPanel).getAllByRole("row");
      expect(rows.length).toBe(7);
    });

    it("combines error toggle with method filter", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");

      // Select POST + error toggle
      await user.click(within(modalPanel).getByTestId("method-chip-POST"));
      await user.click(within(modalPanel).getByTestId("error-toggle"));

      // 1 header + 2 POST error rows = 3 rows
      const rows = within(modalPanel).getAllByRole("row");
      expect(rows.length).toBe(3);
    });

    it("filters by path search in real-time", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const pathInput = within(modalPanel).getByTestId("path-search");

      // Type "users" — should match /api/users (GET) and /api/users (POST)
      await user.type(pathInput, "users");

      const rows = within(modalPanel).getAllByRole("row");
      expect(rows.length).toBe(3); // 1 header + 2 data rows
    });

    it("filters by path case-insensitively", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const pathInput = within(modalPanel).getByTestId("path-search");

      // Type uppercase "USERS"
      await user.type(pathInput, "USERS");

      const rows = within(modalPanel).getAllByRole("row");
      expect(rows.length).toBe(3); // 1 header + 2 data rows
    });

    it("clearing path search restores all rows", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      const pathInput = within(modalPanel).getByTestId("path-search");

      await user.type(pathInput, "users");
      expect(within(modalPanel).getAllByRole("row").length).toBe(3);

      // Clear the input
      await user.clear(pathInput);
      expect(within(modalPanel).getAllByRole("row").length).toBe(16);
    });

    it("clears all filters when Clear all is clicked", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");

      // Activate multiple filters
      await user.click(within(modalPanel).getByTestId("method-chip-POST"));
      await user.click(within(modalPanel).getByTestId("error-toggle"));
      await user.type(within(modalPanel).getByTestId("path-search"), "api");

      // Verify filters are active (POST errors with "api" in path: /api/events + /api/users)
      expect(within(modalPanel).getAllByRole("row").length).toBe(3); // header + 2 data rows

      // Click Clear all
      await user.click(within(modalPanel).getByTestId("clear-all"));

      // All 15 traces restored
      expect(within(modalPanel).getAllByRole("row").length).toBe(16);

      // Filter bar controls reset
      expect(within(modalPanel).queryByTestId("clear-all")).not.toBeInTheDocument();
      expect(within(modalPanel).queryByTestId("active-count")).not.toBeInTheDocument();
    });

    it("hides Clear all when no filters are active", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).queryByTestId("clear-all")).not.toBeInTheDocument();
    });

    it("shows active count badge with correct number", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");

      // Start: no badge
      expect(within(modalPanel).queryByTestId("active-count")).not.toBeInTheDocument();

      // One filter active (POST chip)
      await user.click(within(modalPanel).getByTestId("method-chip-POST"));
      const badge1 = within(modalPanel).getByTestId("active-count");
      expect(badge1).toHaveTextContent("1");

      // Two filters active (+ error toggle)
      await user.click(within(modalPanel).getByTestId("error-toggle"));
      const badge2 = within(modalPanel).getByTestId("active-count");
      expect(badge2).toHaveTextContent("2");

      // Three filters active (+ path search)
      await user.type(within(modalPanel).getByTestId("path-search"), "api");
      const badge3 = within(modalPanel).getByTestId("active-count");
      expect(badge3).toHaveTextContent("3");
    });

    // ── Phase 3: Empty state tests ──

    it("shows 'No matching requests' when filters active but no traces match", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");

      // Filter by a method that doesn't exist in sampleTraces
      // PATCH is in sampleTraces (1 trace), so use a non-existent combination
      await user.click(within(modalPanel).getByTestId("method-chip-POST"));
      await user.click(within(modalPanel).getByTestId("error-toggle"));
      await user.type(within(modalPanel).getByTestId("path-search"), "nonexistent");

      expect(within(modalPanel).getByText("No matching requests")).toBeInTheDocument();
    });

    it("still shows 'No recent requests' when traces array is empty (no filters)", async () => {
      mockDetailOk([]);

      render(<LiveMetrics />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));

      const modalPanel = screen.getByTestId("modal-panel");
      expect(within(modalPanel).getByText("No recent requests")).toBeInTheDocument();
      expect(within(modalPanel).queryByText("No matching requests")).not.toBeInTheDocument();
    });

    it("resets filter state when modal closes and reopens", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();

      // Open Go modal and set filters
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));
      const modalPanel1 = screen.getByTestId("modal-panel");
      await user.click(within(modalPanel1).getByTestId("method-chip-POST"));
      expect(within(modalPanel1).getAllByRole("row").length).toBe(5);

      // Close modal
      await user.click(screen.getByTestId("modal-backdrop"));

      // Reopen Go modal — filters should be reset to defaults (15 traces)
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));
      const modalPanel2 = screen.getByTestId("modal-panel");
      expect(within(modalPanel2).getAllByRole("row").length).toBe(16);
      // No active filters
      expect(within(modalPanel2).queryByTestId("active-count")).not.toBeInTheDocument();
    });

    it("resets filter state when switching between Go and Node services", async () => {
      render(<LiveMetrics />);

      const user = userEvent.setup();

      // Open Go modal and set filters
      await user.click(screen.getByRole("button", { name: /go metrics detail/i }));
      const goPanel = screen.getByTestId("modal-panel");
      await user.click(within(goPanel).getByTestId("method-chip-POST"));
      expect(within(goPanel).getAllByRole("row").length).toBe(5);

      // Close Go modal
      await user.click(screen.getByTestId("modal-backdrop"));

      // Open Node modal — filters should be reset
      await user.click(screen.getByRole("button", { name: /node metrics detail/i }));
      const nodePanel = screen.getByTestId("modal-panel");
      expect(within(nodePanel).getAllByRole("row").length).toBe(16);
      expect(within(nodePanel).queryByTestId("active-count")).not.toBeInTheDocument();
    });
  });
});
