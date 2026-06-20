import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeviceTable } from "../DeviceTable";
import type { Device } from "@/lib/schemas/device";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const mockDevices: Device[] = [
  { id: "1", name: "Laptop-01", type: "laptop", createdAt: "2024-01-15T10:00:00Z" },
  { id: "2", name: "Server-01", type: "server", createdAt: "2024-02-20T14:30:00Z" },
];

describe("DeviceTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders table headers", () => {
    render(
      <DeviceTable
        devices={mockDevices}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders device rows with data", () => {
    render(
      <DeviceTable
        devices={mockDevices}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("Laptop-01")).toBeInTheDocument();
    expect(screen.getByText("Server-01")).toBeInTheDocument();
    expect(screen.getByText("laptop")).toBeInTheDocument();
    expect(screen.getByText("server")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <DeviceTable
        devices={[]}
        isLoading={true}
        isError={false}
        onRetry={() => {}}
        onDelete={() => {}}
      />,
    );

    // Should show skeleton rows
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons!.length).toBeGreaterThan(0);
  });

  it("shows empty state when no devices and not loading", () => {
    render(
      <DeviceTable
        devices={[]}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText(/no devices yet/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first device/i)).toBeInTheDocument();
  });

  it("shows error state when isError is true", () => {
    render(
      <DeviceTable
        devices={[]}
        isLoading={false}
        isError={true}
        onRetry={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText(/failed to load devices/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();
    render(
      <DeviceTable
        devices={[]}
        isLoading={false}
        isError={true}
        onRetry={onRetry}
        onDelete={() => {}}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("has View button that navigates to device detail", async () => {
    render(
      <DeviceTable
        devices={mockDevices}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
        onDelete={() => {}}
      />,
    );

    const viewButtons = screen.getAllByRole("button", { name: /view/i });
    expect(viewButtons).toHaveLength(2);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(
      <DeviceTable
        devices={mockDevices}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
        onDelete={onDelete}
      />,
    );

    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]!);
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
