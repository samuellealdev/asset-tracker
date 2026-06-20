import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const mockEvents: {
  id: string;
  type: string;
  deviceId: string;
  name: string;
  timestamp: string;
  actor: string | null;
  description: string | null;
}[] = [
  {
    id: "evt-1",
    type: "device.created",
    deviceId: "dev-1",
    name: "Device 1 created",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "admin",
    description: "New device",
  },
  {
    id: "evt-2",
    type: "device.updated",
    deviceId: "dev-2",
    name: "Device 2 updated",
    timestamp: "2025-06-01T13:00:00Z",
    actor: "operator",
    description: "Firmware updated",
  },
];

let mockIsLoading = false;
let mockIsError = false;
let mockRefetch = vi.fn();
let mockMutateAsync = vi.fn();
let mockDeviceId: string | undefined;

vi.mock("@/hooks/use-events", () => ({
  useEvents: (deviceId?: string) => {
    mockDeviceId = deviceId;
    return {
      data: deviceId
        ? mockEvents.filter((e) => e.deviceId === deviceId)
        : mockEvents,
      isLoading: mockIsLoading,
      isError: mockIsError,
      refetch: mockRefetch,
    };
  },
  useCreateEvent: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-devices", () => ({
  useDevices: () => ({
    data: [
      { id: "dev-1", name: "Laptop-01", type: "laptop", createdAt: "2024-01-01" },
      { id: "dev-2", name: "Server-01", type: "server", createdAt: "2024-01-02" },
    ],
    isLoading: false,
  }),
}));

import { EventsPage } from "../events";

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

describe("EventsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockIsLoading = false;
    mockIsError = false;
    mockDeviceId = undefined;
    mockRefetch = vi.fn();
    mockMutateAsync = vi.fn().mockResolvedValue(mockEvents[0]);
    // Reset mockEvents to 2 items
    mockEvents.length = 0;
    mockEvents.push(
      {
        id: "evt-1",
        type: "device.created",
        deviceId: "dev-1",
        name: "Device 1 created",
        timestamp: "2025-06-01T12:00:00Z",
        actor: "admin",
        description: "New device",
      },
      {
        id: "evt-2",
        type: "device.updated",
        deviceId: "dev-2",
        name: "Device 2 updated",
        timestamp: "2025-06-01T13:00:00Z",
        actor: "operator",
        description: "Firmware updated",
      },
    );
  });

  it("renders the events title and create event button", () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/events/i)).toBeInTheDocument();
    expect(screen.getByText(/create event/i)).toBeInTheDocument();
  });

  it("renders event table with data", () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByText("device.created")).toBeInTheDocument();
    expect(screen.getByText("dev-1")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockIsLoading = true;

    const { container } = render(<EventsPage />, { wrapper: createWrapper() });

    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows error state with retry", async () => {
    mockIsError = true;
    mockEvents.length = 0;

    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load events/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it("shows empty state when no events", () => {
    mockEvents.length = 0;

    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/no events found/i)).toBeInTheDocument();
  });

  it("renders device filter dropdown with all devices option", () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/filter by device/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /all devices/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /laptop-01/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /server-01/i })).toBeInTheDocument();
  });

  it("filters events when a device is selected", async () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/filter by device/i), "dev-1");

    await waitFor(() => {
      expect(screen.getByText("device.created")).toBeInTheDocument();
    });
    expect(screen.queryByText("device.updated")).not.toBeInTheDocument();
    expect(mockDeviceId).toBe("dev-1");
  });

  it("shows all events when filter is set to all devices", () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    expect(mockDeviceId).toBeUndefined();
    expect(screen.getByText("device.created")).toBeInTheDocument();
    expect(screen.getByText("device.updated")).toBeInTheDocument();
  });
});
