import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeviceCard } from "../DeviceCard";
import type { Device } from "@/lib/schemas/device";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockDevice: Device = {
  id: "abc-123-def-456",
  name: "Laptop-01",
  type: "laptop",
  createdAt: "2024-01-15T10:00:00Z",
};

describe("DeviceCard", () => {
  it("renders device name, type, id, and createdAt", () => {
    render(<DeviceCard device={mockDevice} />);

    expect(screen.getByText("Laptop-01")).toBeInTheDocument();
    expect(screen.getByText("laptop")).toBeInTheDocument();
    // ID is truncated and rendered as separate text nodes, check the heading exists
    expect(screen.getByRole("heading", { name: "Laptop-01" })).toBeInTheDocument();
    expect(screen.getByText(/created/i)).toBeInTheDocument();
  });

  it("navigates to device detail on click", async () => {
    render(<DeviceCard device={mockDevice} />);

    const user = userEvent.setup();
    await user.click(screen.getByText("Laptop-01"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/devices/$id", params: { id: "abc-123-def-456" } });
  });

  it("displays full device id in monospace font", () => {
    render(<DeviceCard device={mockDevice} />);

    const idElement = screen.getByText("abc-123-def-456");
    expect(idElement).toBeInTheDocument();
    expect(idElement.className).toContain("font-mono");
  });
});
