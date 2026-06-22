import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/devices" }),
  Outlet: () => null,
  createFileRoute: () => (config: any) => config,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const deviceData = [
  { id: "1", name: "Device 1", type: "laptop", createdAt: "2024-01-01" },
  { id: "2", name: "Device 2", type: "server", createdAt: "2024-01-02" },
];

// Mutable array that tests can clear/restore — the mock returns this reference
const mockDevices: { id: string; name: string; type: string; createdAt: string }[] = [];

function resetMockDevices() {
  mockDevices.length = 0;
  for (const d of deviceData) {
    mockDevices.push({ ...d });
  }
}
resetMockDevices();

let mockIsLoading = false;
let mockIsError = false;
let mockRefetch = vi.fn();

vi.mock("@/hooks/use-devices", () => ({
  useDevices: () => ({
    data: mockDevices,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
  }),
  useDevice: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
  useCreateDevice: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateDevice: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteDevice: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

import { DevicesPage } from "../devices";

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

describe("DevicesPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockIsLoading = false;
    mockIsError = false;
    resetMockDevices();
    mockRefetch = vi.fn();
  });

  it("renders the devices title and create button", () => {
    render(<DevicesPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/devices/i)).toBeInTheDocument();
    expect(screen.getByText(/create device/i)).toBeInTheDocument();
  });

  it("renders device list when data is loaded", () => {
    render(<DevicesPage />, { wrapper: createWrapper() });

    expect(screen.getByText("Device 1")).toBeInTheDocument();
    expect(screen.getByText("Device 2")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockIsLoading = true;

    render(<DevicesPage />, { wrapper: createWrapper() });

    // The DeviceGrid renders loading skeleton
    const container = document.body;
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows error state with retry", async () => {
    mockIsError = true;
    mockDevices.length = 0;

    render(<DevicesPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load devices/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it("shows empty state when no devices", () => {
    mockDevices.length = 0;

    render(<DevicesPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/no devices yet/i)).toBeInTheDocument();
  });

  it("opens create modal when create device button is clicked", async () => {
    render(<DevicesPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByText(/create device/i));

    // Modal with "Create Device" heading should appear
    expect(screen.getByRole("heading", { name: "Create Device" })).toBeInTheDocument();
  });


});
