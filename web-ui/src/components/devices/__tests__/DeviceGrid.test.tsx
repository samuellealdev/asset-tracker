import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeviceGrid } from "../DeviceGrid";
import type { Device } from "@/lib/schemas/device";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockDevices: Device[] = [
  { id: "1", name: "Laptop-01", type: "laptop", createdAt: "2024-01-15T10:00:00Z" },
  { id: "2", name: "Server-01", type: "server", createdAt: "2024-02-20T14:30:00Z" },
  { id: "3", name: "Switch-01", type: "network", createdAt: "2024-03-10T08:00:00Z" },
];

describe("DeviceGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders device cards for each device", () => {
    render(
      <DeviceGrid
        devices={mockDevices}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        onViewEvents={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Laptop-01")).toBeInTheDocument();
    expect(screen.getByText("Server-01")).toBeInTheDocument();
    expect(screen.getByText("Switch-01")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <DeviceGrid
        devices={[]}
        isLoading={true}
        isError={false}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        onViewEvents={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    // Should render skeleton placeholders with animate-pulse
    const skeletons = container.querySelectorAll('[aria-label="Loading"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("shows empty state when no devices and not loading", () => {
    render(
      <DeviceGrid
        devices={[]}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        onViewEvents={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText(/no devices yet/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first device/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create device/i }),
    ).toBeInTheDocument();
  });

  it("navigates to create page from empty state button", async () => {
    render(
      <DeviceGrid
        devices={[]}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        onViewEvents={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /create device/i }));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/devices/create" });
  });

  it("shows error state when isError is true", () => {
    render(
      <DeviceGrid
        devices={[]}
        isLoading={false}
        isError={true}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
onViewEvents={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText(/failed to load devices/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked in error state", async () => {
    const onRetry = vi.fn();
    render(
      <DeviceGrid
        devices={[]}
        isLoading={false}
        isError={true}
        onRetry={onRetry}
        onDelete={vi.fn()}
        onViewEvents={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("passes onDelete and onViewEvents to DeviceGridCard", async () => {
    const onDelete = vi.fn();
    const onViewEvents = vi.fn();
    const onEdit = vi.fn();
    render(
      <DeviceGrid
        devices={[mockDevices[0]!]}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onDelete={onDelete}
        onViewEvents={onViewEvents}
        onEdit={onEdit}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("1");

    await user.click(screen.getByRole("button", { name: /events/i }));
    expect(onViewEvents).toHaveBeenCalledWith("1");
  });
});
