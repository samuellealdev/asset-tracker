import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeviceForm } from "../DeviceForm";
import type { Device } from "@/lib/schemas/device";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockDevice: Device = {
  id: "1",
  name: "Laptop-01",
  type: "laptop",
  createdAt: "2024-01-15T10:00:00Z",
};

describe("DeviceForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders create form with empty fields", () => {
    render(
      <DeviceForm
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue("");
    expect(screen.getByLabelText(/type/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /create device/i })).toBeInTheDocument();
  });

  it("renders edit form pre-filled with device values", () => {
    render(
      <DeviceForm
        device={mockDevice}
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue("Laptop-01");
    expect(screen.getByLabelText(/type/i)).toHaveValue("laptop");
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    render(
      <DeviceForm
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /create device/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/type is required/i)).toBeInTheDocument();
    });
  });

  it("calls onSubmit with form data on valid submission", async () => {
    const onSubmit = vi.fn();
    render(
      <DeviceForm
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/name/i), "New Device");
    await user.type(screen.getByLabelText(/type/i), "server");
    await user.click(screen.getByRole("button", { name: /create device/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "New Device",
        type: "server",
      });
    });
  });

  it("disables submit button while pending", () => {
    render(
      <DeviceForm
        onSubmit={async () => {}}
        isPending={true}
      />,
    );

    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
  });

  it("renders cancel button that navigates back", async () => {
    render(
      <DeviceForm
        onSubmit={async () => {}}
        isPending={false}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText(/cancel/i));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/devices" });
  });
});
