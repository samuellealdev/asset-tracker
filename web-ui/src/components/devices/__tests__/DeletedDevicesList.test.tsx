import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeletedDevicesList } from "../DeletedDevicesList";

vi.mock("@/hooks/use-events", () => ({
  useDeletedDevices: vi.fn(),
  useEvents: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

import { useDeletedDevices, useEvents } from "@/hooks/use-events";
import type { Event } from "@/lib/schemas/event";

const baseEvents = [
  {
    id: "evt-1",
    type: "device.deleted",
    deviceId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Old Laptop",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "admin",
    description: "Decommissioned",
  },
  {
    id: "evt-2",
    type: "device.deleted",
    deviceId: "660e8400-e29b-41d4-a716-446655440001",
    name: "Old Monitor",
    timestamp: "2025-06-02T12:00:00Z",
    actor: null,
    description: null,
  },
];

function setupUserEvent() {
  return { user: userEvent.setup() };
}

function mockDeletedDevices(data: typeof baseEvents | null = baseEvents) {
  vi.mocked(useDeletedDevices).mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDeletedDevices>);
}

function mockDeviceEvents(overrides?: {
  data?: Event[] | null;
  isLoading?: boolean;
  isError?: boolean;
}) {
  vi.mocked(useEvents).mockReturnValue({
    data: overrides?.data ?? null,
    isLoading: overrides?.isLoading ?? false,
    isError: overrides?.isError ?? false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useEvents>);
}

describe("DeletedDevicesList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDeviceEvents();
  });

  it("shows loading skeleton while fetching", () => {
    vi.mocked(useDeletedDevices).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDeletedDevices>);

    render(<DeletedDevicesList showDeleted={false} onToggle={vi.fn()} />);

    expect(screen.getByText("Deleted Devices")).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(3);
  });

  it("shows error message and retry button when fetch fails", () => {
    const refetch = vi.fn();
    vi.mocked(useDeletedDevices).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useDeletedDevices>);

    render(<DeletedDevicesList showDeleted={false} onToggle={vi.fn()} />);

    expect(screen.getByText("Failed to load deleted devices")).toBeInTheDocument();
    const retryButton = screen.getByText("Try again");
    retryButton.click();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("shows empty state when no deleted devices exist", () => {
    mockDeletedDevices([]);

    render(<DeletedDevicesList showDeleted={false} onToggle={vi.fn()} />);

    expect(screen.getByText("No deleted devices")).toBeInTheDocument();
  });

  it("does not render anything when events is null (no data yet)", () => {
    mockDeletedDevices(null);

    const { container } = render(
      <DeletedDevicesList showDeleted={false} onToggle={vi.fn()} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders toggle button with count when events exist", () => {
    mockDeletedDevices();

    render(<DeletedDevicesList showDeleted={false} onToggle={vi.fn()} />);

    const toggle = screen.getByRole("button", { name: /show deleted devices/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle.textContent).toContain("2");
  });

  it("calls onToggle when toggle button is clicked", () => {
    const onToggle = vi.fn();
    mockDeletedDevices();

    render(<DeletedDevicesList showDeleted={false} onToggle={onToggle} />);

    screen.getByRole("button", { name: /show deleted devices/i }).click();
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows 'Hide deleted devices' when showDeleted is true", () => {
    mockDeletedDevices();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: /hide deleted devices/i })).toBeInTheDocument();
  });

  it("renders DeviceGridCard for each event when showDeleted is true", () => {
    mockDeletedDevices();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    expect(screen.getByText("Old Laptop")).toBeInTheDocument();
    expect(screen.getByText("Old Monitor")).toBeInTheDocument();
  });

  it("renders only Details button on deleted device cards", () => {
    mockDeletedDevices();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    // Only Details buttons, no Edit or the plain "Delete" action
    const detailsButtons = screen.getAllByRole("button", { name: /details/i });
    expect(detailsButtons).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^delete$/i })).not.toBeInTheDocument();
  });

  it("opens a modal with event details when Details is clicked", async () => {
    mockDeletedDevices();
    mockDeviceEvents();
    const { user } = setupUserEvent();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    const detailsButtons = screen.getAllByRole("button", { name: /details/i });
    await user.click(detailsButtons[0]!);

    // Modal should show device-specific info from the event
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Deleted Device")).toBeInTheDocument();
    expect(
      screen.getByText("550e8400-e29b-41d4-a716-446655440000"),
    ).toBeInTheDocument();
  });

  it("hides deleted section content when showDeleted is false", () => {
    mockDeletedDevices();
    mockDeviceEvents();

    const { container } = render(
      <DeletedDevicesList showDeleted={false} onToggle={vi.fn()} />,
    );

    // The card wrapper has max-h-0 opacity-0 when hidden
    const cardWrapper = container.querySelector(".overflow-hidden");
    expect(cardWrapper?.className).toContain("max-h-0");
    expect(cardWrapper?.className).toContain("opacity-0");
  });

  it("shows event timeline loading state when modal opens", async () => {
    mockDeletedDevices();
    mockDeviceEvents({ isLoading: true });
    const { user } = setupUserEvent();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: /details/i })[0]!);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Event Timeline")).toBeInTheDocument();
    expect(screen.getByText("Deleted Device")).toBeInTheDocument();
  });

  it("shows event timeline error state with retry button", async () => {
    const refetchEvents = vi.fn();
    mockDeletedDevices();
    vi.mocked(useEvents).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchEvents,
    } as unknown as ReturnType<typeof useEvents>);
    const { user } = setupUserEvent();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: /details/i })[0]!);

    expect(screen.getByText("Failed to load events")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    await user.click(retryButton);
    expect(refetchEvents).toHaveBeenCalledOnce();
  });

  it("shows empty timeline state when device has no events", async () => {
    mockDeletedDevices();
    mockDeviceEvents({ data: [] });
    const { user } = setupUserEvent();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: /details/i })[0]!);

    expect(screen.getByText("No events for this device")).toBeInTheDocument();
  });

    it("shows device events in the timeline inside the modal", async () => {
      const timelineEvents: Event[] = [
        {
          id: "evt-created",
          type: "device.created",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          name: "Old Laptop",
          timestamp: "2025-01-15T08:00:00Z",
          actor: "admin",
          description: null,
        },
        {
          id: "evt-deleted",
          type: "device.deleted",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          name: "Old Laptop",
          timestamp: "2025-06-01T12:00:00Z",
          actor: "admin",
          description: "Decommissioned",
        },
      ];
      mockDeletedDevices();
    mockDeviceEvents({ data: timelineEvents });
    const { user } = setupUserEvent();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: /details/i })[0]!);

    // Basic info still shows
    expect(screen.getByText("Deleted Device")).toBeInTheDocument();
    expect(
      screen.getByText("550e8400-e29b-41d4-a716-446655440000"),
    ).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();

    // Timeline events shown — "Decommissioned" appears twice (basic info + timeline)
    expect(screen.getByText("device.created")).toBeInTheDocument();
    expect(screen.getByText("device.deleted")).toBeInTheDocument();
    expect(screen.getAllByText("Decommissioned")).toHaveLength(2);
  });

  it("closes modal and hides timeline when close is clicked", async () => {
    mockDeletedDevices();
    mockDeviceEvents();
    const { user } = setupUserEvent();

    render(<DeletedDevicesList showDeleted={true} onToggle={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: /details/i })[0]!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
