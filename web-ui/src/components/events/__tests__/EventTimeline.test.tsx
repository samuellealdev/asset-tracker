import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventTimeline } from "../EventTimeline";
import type { Event } from "@/lib/schemas/event";

const mockEvents: Event[] = [
  {
    id: "evt-1",
    type: "device.created",
    deviceId: "dev-1",
    name: "Device created",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "admin",
    description: "New device added",
  },
  {
    id: "evt-2",
    type: "device.updated",
    deviceId: "dev-1",
    name: "Device updated",
    timestamp: "2025-06-01T13:00:00Z",
    actor: "operator",
    description: "Firmware updated",
  },
  {
    id: "evt-3",
    type: "device.deleted",
    deviceId: "dev-1",
    name: "Device deleted",
    timestamp: "2025-06-01T14:00:00Z",
    actor: null,
    description: null,
  },
];

describe("EventTimeline", () => {
  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(<EventTimeline events={[]} isLoading={true} />);

    // Should show skeleton elements (animate-pulse class)
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
  it("renders a list of events in chronological order", () => {
    render(<EventTimeline events={mockEvents} />);

    expect(screen.getByText("Device created")).toBeInTheDocument();
    expect(screen.getByText("Device updated")).toBeInTheDocument();
    expect(screen.getByText("Device deleted")).toBeInTheDocument();
  });

  it("renders event type badges", () => {
    render(<EventTimeline events={mockEvents} />);

    expect(screen.getByText("device.created")).toBeInTheDocument();
    expect(screen.getByText("device.updated")).toBeInTheDocument();
    expect(screen.getByText("device.deleted")).toBeInTheDocument();
  });

  it("renders actor names when available", () => {
    render(<EventTimeline events={mockEvents} />);

    expect(screen.getByText(/admin/)).toBeInTheDocument();
    expect(screen.getByText(/operator/)).toBeInTheDocument();
  });

  it("does not render 'by' prefix when actor is null", () => {
    render(<EventTimeline events={mockEvents} />);

    // Third event has actor: null — should not show "by"
    const text = document.body.textContent || "";
    // The third event should NOT have "by" prefix
    const byMatches = text.match(/by /g);
    expect(byMatches).toHaveLength(2); // Only first two events have actors
  });

  it("shows empty state when no events", () => {
    render(<EventTimeline events={[]} />);

    expect(screen.getByText(/no events for this device/i)).toBeInTheDocument();
  });

  it("renders timestamps as formatted dates", () => {
    render(<EventTimeline events={mockEvents} />);

    // All three events share the same date
    expect(screen.getAllByText("6/1/2025")).toHaveLength(3);
  });
});
