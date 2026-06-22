import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "1" }),
  createFileRoute: () => (config: any) => config,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const mockDevice = {
  id: "1",
  name: "Device 1",
  type: "laptop",
  createdAt: "2024-01-01",
};

let mockIsLoading = false;
let mockIsError = false;
let mockRefetch = vi.fn();
let mockCreateEvent = vi.fn().mockResolvedValue({ id: "evt-2" });

vi.mock("@/hooks/use-devices", () => ({
  useDevice: () => ({
    data: mockDevice,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
  }),
  useUpdateDevice: () => ({
    mutateAsync: vi.fn().mockResolvedValue(mockDevice),
    isPending: false,
  }),
  useDeleteDevice: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

const mockDeviceEvents = [
  {
    id: "evt-1",
    type: "device.created",
    deviceId: "1",
    name: "Device created",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "admin",
    description: "New device added",
  },
];

vi.mock("@/hooks/use-events", () => ({
  useEvents: () => ({
    data: mockDeviceEvents,
    isLoading: false,
    isError: false,
  }),
  useCreateEvent: () => ({
    mutateAsync: mockCreateEvent,
    isPending: false,
  }),
}));

import { DeviceDetailPage } from "../devices.$id";

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

describe("DeviceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockIsError = false;
    mockRefetch = vi.fn();
  });

  it("renders device detail when loaded", () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText("Device 1")).toBeInTheDocument();
    expect(screen.getByText("laptop")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockIsLoading = true;

    const { container } = render(<DeviceDetailPage />, {
      wrapper: createWrapper(),
    });

    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows error state when device not found", () => {
    mockIsError = true;

    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/device not found/i)).toBeInTheDocument();
  });

  it("has back button that navigates to devices list", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByText(/back/i));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/devices" });
  });

  it("shows delete dialog and confirms deletion", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    // Click the page-level delete button (first one)
    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]!);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // The dialog's confirm button is the second "Delete"
    const dialogDeleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(dialogDeleteButtons[1]!);

    // The component navigates to /devices on success
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/devices" });
    });
  });

  it("shows event timeline section when device is loaded", () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/event timeline/i)).toBeInTheDocument();
    expect(screen.getByText("Device created")).toBeInTheDocument();
    expect(screen.getByText("device.created")).toBeInTheDocument();
  });

  it("shows New Event button in the event timeline section", () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    expect(
      screen.getByRole("button", { name: /new event/i }),
    ).toBeInTheDocument();
  });

  it("opens event creation modal when New Event is clicked", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new event/i }));

    expect(screen.getByRole("heading", { name: "Create Event" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Event name/i)).toBeInTheDocument();
  });

  it("displays preset type chips in the event form", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new event/i }));

    expect(screen.getByText("maintenance")).toBeInTheDocument();
    expect(screen.getByText("inspection")).toBeInTheDocument();
    expect(screen.getByText("repair")).toBeInTheDocument();
    expect(screen.getByText("relocation")).toBeInTheDocument();
  });

  it("closes modal when Cancel is clicked", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new event/i }));
    expect(screen.getByRole("heading", { name: "Create Event" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Create Event" })).not.toBeInTheDocument();
    });
  });

  it("shows validation errors when submitting empty event form", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new event/i }));
    await user.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(screen.getByText(/Type is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });

  it("submits event form and closes modal on success", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /new event/i }));

    // Verify modal is open
    expect(screen.getByTestId("modal-panel")).toBeInTheDocument();

    // Fill type
    fireEvent.click(screen.getByText("maintenance"));
    // Fill name
    fireEvent.change(screen.getByPlaceholderText(/Event name/i), {
      target: { value: "Monthly maintenance" },
    });
    // Fill description
    fireEvent.change(screen.getByPlaceholderText("Event description (optional)"), {
      target: { value: "Routine check completed" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));

    // Modal should close after successful creation
    await waitFor(() => {
      expect(screen.queryByTestId("modal-panel")).not.toBeInTheDocument();
    });
  });

  it("shows device name in the event form", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new event/i }));

    // The device indicator shows "Device: Device 1" in a div
    const deviceIndicator = screen
      .getAllByText(/Device:/i)
      .find((el) => el.closest("[data-testid='modal-panel']"));

    expect(deviceIndicator).toBeInTheDocument();
    expect(deviceIndicator?.textContent).toMatch(/Device:\s*Device 1/);
  });

  it("cancels deletion when cancel is clicked", async () => {
    render(<DeviceDetailPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]!);

    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Click cancel
    await user.click(screen.getByText(/cancel/i));

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
