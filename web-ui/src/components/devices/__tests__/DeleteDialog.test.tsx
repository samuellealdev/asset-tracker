import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteDialog } from "../DeleteDialog";

describe("DeleteDialog", () => {
  it("renders the confirmation message with device name", () => {
    render(
      <DeleteDialog
        deviceName="Laptop-01"
        isOpen={true}
        isPending={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/Laptop-01/)).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <DeleteDialog
        deviceName="Laptop-01"
        isOpen={false}
        isPending={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it("calls onConfirm when delete button is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <DeleteDialog
        deviceName="Laptop-01"
        isOpen={true}
        isPending={false}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(
      <DeleteDialog
        deviceName="Laptop-01"
        isOpen={true}
        isPending={false}
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText(/cancel/i));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables delete button while pending", () => {
    render(
      <DeleteDialog
        deviceName="Laptop-01"
        isOpen={true}
        isPending={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
  });
});
