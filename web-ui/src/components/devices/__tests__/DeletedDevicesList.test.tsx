import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeletedDevicesList } from "../DeletedDevicesList";

vi.mock("@/hooks/use-events", () => ({
  useDeletedDevices: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

import { useDeletedDevices } from "@/hooks/use-events";

describe("DeletedDevicesList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeleton while fetching", () => {
    vi.mocked(useDeletedDevices).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDeletedDevices>);

    render(<DeletedDevicesList />);

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

    render(<DeletedDevicesList />);

    expect(screen.getByText("Failed to load deleted devices")).toBeInTheDocument();
    const retryButton = screen.getByText("Try again");
    retryButton.click();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("shows empty state when no deleted devices exist", () => {
    vi.mocked(useDeletedDevices).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDeletedDevices>);

    render(<DeletedDevicesList />);

    expect(screen.getByText("No deleted devices")).toBeInTheDocument();
  });

  it("renders cards for each deleted device", () => {
    vi.mocked(useDeletedDevices).mockReturnValue({
      data: [
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
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDeletedDevices>);

    render(<DeletedDevicesList />);

    // Card content
    expect(screen.getByText("Old Laptop")).toBeInTheDocument();
    expect(screen.getByText("Old Monitor")).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Jun 1, 2025"))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Jun 2, 2025"))).toBeInTheDocument();

    // Deleted badges
    const badges = screen.getAllByText("Deleted");
    expect(badges).toHaveLength(2);

    // Details buttons
    const detailsButtons = screen.getAllByRole("button", { name: /details/i });
    expect(detailsButtons).toHaveLength(2);
  });
});
