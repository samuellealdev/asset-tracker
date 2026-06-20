import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

const mockEvents = [
  {
    id: "evt-1",
    type: "device.created",
    deviceId: "dev-1",
    name: "Device 1 created",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "admin",
    description: "New device",
  },
];

let mockIsLoading = false;
let mockIsError = false;
let mockRefetch = vi.fn();
let mockMutateAsync = vi.fn();

vi.mock("@/hooks/use-events", () => ({
  useEvents: () => ({
    data: mockEvents,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
  }),
  useCreateEvent: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-devices", () => ({
  useDevices: () => ({
    data: [
      { id: "dev-1", name: "Laptop-01", type: "laptop", createdAt: "2024-01-01" },
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
    mockEvents.length = 1;
    mockRefetch = vi.fn();
    mockMutateAsync = vi.fn().mockResolvedValue(mockEvents[0]);
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

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it("shows empty state when no events", () => {
    mockEvents.length = 0;

    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/no events found/i)).toBeInTheDocument();
  });
});
