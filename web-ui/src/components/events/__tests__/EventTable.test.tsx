import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventTable } from "../EventTable";
import type { Event } from "@/lib/schemas/event";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const mockEvents: Event[] = [
  {
    id: "evt-1",
    type: "device.created",
    deviceId: "dev-1",
    name: "Device 1 created",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "admin",
    description: "New device added",
  },
  {
    id: "evt-2",
    type: "device.updated",
    deviceId: "dev-2",
    name: "Device 2 updated",
    timestamp: "2025-06-01T13:00:00Z",
    actor: "operator",
    description: "Firmware updated",
  },
];

describe("EventTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders table headers", () => {
    render(
      <EventTable
        events={mockEvents}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
      />,
    );

    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Device")).toBeInTheDocument();
    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Actor")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders event rows with data", () => {
    render(
      <EventTable
        events={mockEvents}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
      />,
    );

    expect(screen.getByText("dev-1")).toBeInTheDocument();
    expect(screen.getByText("dev-2")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("operator")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <EventTable
        events={[]}
        isLoading={true}
        isError={false}
        onRetry={() => {}}
      />,
    );

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons!.length).toBeGreaterThan(0);
  });

  it("shows empty state when no events and not loading", () => {
    render(
      <EventTable
        events={[]}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
      />,
    );

    expect(screen.getByText("No events found")).toBeInTheDocument();
  });

  it("shows error state when isError is true", () => {
    render(
      <EventTable
        events={[]}
        isLoading={false}
        isError={true}
        onRetry={() => {}}
      />,
    );

    expect(screen.getByText(/failed to load events/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();
    render(
      <EventTable
        events={[]}
        isLoading={false}
        isError={true}
        onRetry={onRetry}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders colored badges for different event types", () => {
    render(
      <EventTable
        events={mockEvents}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
      />,
    );

    expect(screen.getByText("device.created")).toBeInTheDocument();
    expect(screen.getByText("device.updated")).toBeInTheDocument();
  });
});
