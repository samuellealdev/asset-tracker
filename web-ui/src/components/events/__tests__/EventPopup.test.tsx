import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Event } from "@/lib/schemas/event";

// --- Mock useEvents / useCreateEvent ---
const mockEventsData: Event[] = [];
let mockIsLoading = false;
let mockIsError = false;
const mockRefetch = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock("@/hooks/use-events", () => ({
  useEvents: () => ({
    data: mockEventsData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
  }),
  useCreateEvent: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// We test with the real Modal (no mock needed since it's already tested)
import { EventPopup } from "../EventPopup";

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

const sampleEvents: Event[] = [
  {
    id: "evt-1",
    type: "maintenance",
    deviceId: "dev-1",
    name: "Oil change",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "admin",
    description: "Routine maintenance",
  },
  {
    id: "evt-2",
    type: "inspection",
    deviceId: "dev-1",
    name: "Annual check",
    timestamp: "2025-06-10T08:00:00Z",
    actor: null,
    description: null,
  },
];

describe("EventPopup", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockIsError = false;
    mockEventsData.length = 0;
    mockMutateAsync.mockResolvedValue({ id: "evt-3" });
  });

  it("does not render when isOpen is false", () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={false}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.queryByText(/Events for/i)).not.toBeInTheDocument();
  });

  it("renders modal with device name in title when isOpen is true", () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/Events for Laptop-01/i)).toBeInTheDocument();
  });

  it("shows loading state while events are fetching", () => {
    mockIsLoading = true;

    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    const modal = screen.getByTestId("modal-panel");
    expect(modal.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("renders event timeline when events are loaded", () => {
    mockEventsData.push(...sampleEvents);

    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText("Oil change")).toBeInTheDocument();
    expect(screen.getByText("Annual check")).toBeInTheDocument();
  });

  it("shows empty state when device has no events", () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/No events for this device/i)).toBeInTheDocument();
  });

  it("shows error state with retry when events fetch fails", async () => {
    mockIsError = true;

    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/Failed to load events/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it("closes modal when backdrop is clicked", async () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders simplified event form fields", () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    // Form has type chips + name + description
    expect(screen.getByText("maintenance")).toBeInTheDocument();
    expect(screen.getByText("inspection")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Event name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Event description/i)).toBeInTheDocument();
  });

  it("does not render device selector or actor field (simplified form)", () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.queryByText(/actor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select device/i)).not.toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /add event/i }));

    await waitFor(() => {
      expect(screen.getByText(/Type is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });

  it("submits form and creates event with deviceId pre-bound", async () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    const user = userEvent.setup();

    // Fill type
    await user.click(screen.getByText("maintenance"));
    // Fill name
    await user.type(screen.getByPlaceholderText(/Event name/i), "Routine maintenance");
    // Fill description
    await user.type(
      screen.getByPlaceholderText(/Event description/i),
      "Monthly check completed",
    );
    // Submit
    await user.click(screen.getByRole("button", { name: /add event/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "maintenance",
          deviceId: "dev-1",
          name: "Routine maintenance",
          description: "Monthly check completed",
        }),
      );
    });
  });

  it("shows success feedback after event creation", async () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    const user = userEvent.setup();

    await user.click(screen.getByText("maintenance"));
    await user.type(screen.getByPlaceholderText(/Event name/i), "Test");
    await user.click(screen.getByRole("button", { name: /add event/i }));

    await waitFor(() => {
      expect(screen.getByText(/Event created successfully/i)).toBeInTheDocument();
    });
  });

  it("resets form fields after successful creation", async () => {
    render(
      <EventPopup
        deviceId="dev-1"
        deviceName="Laptop-01"
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper: createWrapper() },
    );

    const user = userEvent.setup();

    // Fill and submit
    await user.click(screen.getByText("maintenance"));
    await user.type(screen.getByPlaceholderText(/Event name/i), "Test event");
    await user.click(screen.getByRole("button", { name: /add event/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // Name input should be cleared
    const nameInput = screen.getByPlaceholderText(/Event name/i) as HTMLInputElement;
    expect(nameInput).toHaveValue("");
  });
});
