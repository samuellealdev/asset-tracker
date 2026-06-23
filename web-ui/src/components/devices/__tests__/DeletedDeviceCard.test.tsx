import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeletedDeviceCard } from "../DeletedDeviceCard";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const defaultProps = {
  name: "Old Laptop",
  deviceId: "550e8400-e29b-41d4-a716-446655440000",
  type: "laptop",
  timestamp: "2025-06-01T12:00:00Z",
};

describe("DeletedDeviceCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders device name", () => {
    render(<DeletedDeviceCard {...defaultProps} />);
    expect(screen.getByText("Old Laptop")).toBeInTheDocument();
  });

  it("renders device type as badge", () => {
    render(<DeletedDeviceCard {...defaultProps} />);
    expect(screen.getByText("laptop")).toBeInTheDocument();
  });

  it("renders truncated device ID", () => {
    render(<DeletedDeviceCard {...defaultProps} />);
    expect(screen.getByText("550e8400...")).toBeInTheDocument();
  });

  it("renders deletion date", () => {
    render(<DeletedDeviceCard {...defaultProps} />);
    // formatDate uses "en-US" locale with UTC timezone
    expect(screen.getByText(/deleted:/i)).toBeInTheDocument();
    expect(screen.getByText(/Jun 1, 2025/i)).toBeInTheDocument();
  });

  it("renders 'Deleted' badge", () => {
    render(<DeletedDeviceCard {...defaultProps} />);
    expect(screen.getByText("Deleted")).toBeInTheDocument();
  });

  it("renders only Details button (no Edit, no Delete)", () => {
    render(<DeletedDeviceCard {...defaultProps} />);

    expect(screen.getByRole("button", { name: /details/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("navigates to device detail when Details button is clicked", async () => {
    render(<DeletedDeviceCard {...defaultProps} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /details/i }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/devices/$id",
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    });
  });

  it("applies muted styling class", () => {
    const { container } = render(<DeletedDeviceCard {...defaultProps} />);
    // The card container should have opacity-70
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("opacity-70");
  });
});
