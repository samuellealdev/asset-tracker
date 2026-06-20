import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "../EventForm";
import type { Device } from "@/lib/schemas/device";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockDevices: Device[] = [
  { id: "dev-1", name: "Laptop-01", type: "laptop", createdAt: "2024-01-15T10:00:00Z" },
  { id: "dev-2", name: "Server-01", type: "server", createdAt: "2024-02-20T14:30:00Z" },
];

describe("EventForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders form fields and submit button", () => {
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/device/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create event/i })).toBeInTheDocument();
  });

  it("renders all 8 event type preset chips", () => {
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    const presets = [
      "maintenance",
      "inspection",
      "repair",
      "relocation",
      "decommissioned",
      "alert",
      "audit",
      "firmware-update",
    ];

    for (const preset of presets) {
      expect(screen.getByText(preset)).toBeInTheDocument();
    }
  });

  it("clicking a chip fills the type input", async () => {
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("repair"));

    const input = screen.getByLabelText(/type/i) as HTMLInputElement;
    expect(input).toHaveValue("repair");
  });

  it("accepts a custom type value not in the presets", async () => {
    const onSubmit = vi.fn();
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/type/i), "custom-event-type");
    await user.selectOptions(screen.getByLabelText(/device/i), "dev-1");
    await user.type(screen.getByLabelText(/name/i), "Test event");
    await user.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "custom-event-type",
        }),
      );
    });
  });

  it("populates device dropdown with available devices", () => {
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    const deviceSelect = screen.getByLabelText(/device/i);
    expect(deviceSelect).toBeInTheDocument();
    expect(screen.getByText("Laptop-01")).toBeInTheDocument();
    expect(screen.getByText("Server-01")).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(screen.getByText(/type is required/i)).toBeInTheDocument();
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it("calls onSubmit with form data on valid submission", async () => {
    const onSubmit = vi.fn();
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/type/i), "maintenance");
    await user.selectOptions(screen.getByLabelText(/device/i), "dev-1");
    await user.type(screen.getByLabelText(/name/i), "Test event");
    await user.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "maintenance",
          deviceId: "dev-1",
          name: "Test event",
        }),
      );
    });

    const callArg = onSubmit.mock.calls[0]![0] as Record<string, unknown>;
    expect(callArg.actor).toBeUndefined();
    expect(callArg.description).toBeUndefined();
  });

  it("disables submit button while pending", () => {
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={async () => {}}
        isPending={true}
      />,
    );

    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
  });

  it("renders cancel button that navigates back", async () => {
    render(
      <EventForm
        devices={mockDevices}
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText(/cancel/i));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/events" });
  });
});
