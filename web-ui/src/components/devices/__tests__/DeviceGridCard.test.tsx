import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeviceGridCard } from "../DeviceGridCard";
import type { Device } from "@/lib/schemas/device";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockDevice: Device = {
  id: "dev-1",
  name: "Laptop-01",
  type: "laptop",
  createdAt: "2024-01-15T10:00:00Z",
};

describe("DeviceGridCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders device name as heading", () => {
    render(
      <DeviceGridCard device={mockDevice} onDelete={vi.fn()} onViewEvents={vi.fn()} />,
    );

    expect(screen.getByRole("heading", { name: "Laptop-01" })).toBeInTheDocument();
  });

  it("renders device type as badge", () => {
    render(
      <DeviceGridCard device={mockDevice} onDelete={vi.fn()} onViewEvents={vi.fn()} />,
    );

    expect(screen.getByText("laptop")).toBeInTheDocument();
  });

  it("renders device created date", () => {
    render(
      <DeviceGridCard device={mockDevice} onDelete={vi.fn()} onViewEvents={vi.fn()} />,
    );

    // Date rendered via toLocaleDateString() which is locale-dependent
    const dateText = screen.getByText(/created:/i);
    expect(dateText).toBeInTheDocument();
    expect(dateText.textContent).toContain("2024");
  });

  it("calls onDelete with device id when Delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(
      <DeviceGridCard device={mockDevice} onDelete={onDelete} onViewEvents={vi.fn()} />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith("dev-1");
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("calls onViewEvents with device id when Events button is clicked", async () => {
    const onViewEvents = vi.fn();
    render(
      <DeviceGridCard device={mockDevice} onDelete={vi.fn()} onViewEvents={onViewEvents} />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /events/i }));

    expect(onViewEvents).toHaveBeenCalledWith("dev-1");
    expect(onViewEvents).toHaveBeenCalledOnce();
  });

  it("navigates to device detail when Edit button is clicked", async () => {
    render(
      <DeviceGridCard device={mockDevice} onDelete={vi.fn()} onViewEvents={vi.fn()} />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/devices/$id",
      params: { id: "dev-1" },
    });
  });

  it("renders all three action buttons", () => {
    render(
      <DeviceGridCard device={mockDevice} onDelete={vi.fn()} onViewEvents={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /events/i })).toBeInTheDocument();
  });

  it("long device names renders full name without clipping DOM content", () => {
    const longNameDevice: Device = {
      id: "dev-2",
      name: "Very-Long-Device-Name-That-Exceeds-Thirty-Characters",
      type: "server",
      createdAt: "2024-03-01T08:00:00Z",
    };

    render(
      <DeviceGridCard device={longNameDevice} onDelete={vi.fn()} onViewEvents={vi.fn()} />,
    );

    // CSS truncation is visual-only, the DOM must contain the full name
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Very-Long-Device-Name-That-Exceeds-Thirty-Characters",
    );
  });

  it("renders with a different device type badge", () => {
    const serverDevice: Device = {
      id: "dev-3",
      name: "Server-Prod-01",
      type: "server",
      createdAt: "2024-06-01T12:00:00Z",
    };

    render(
      <DeviceGridCard device={serverDevice} onDelete={vi.fn()} onViewEvents={vi.fn()} />,
    );

    expect(screen.getByText("server")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Server-Prod-01" })).toBeInTheDocument();
  });
});
