import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No items"
        description="Nothing to show here."
      />,
    );

    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Nothing to show here.")).toBeInTheDocument();
  });

  it("renders with an action button", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No devices"
        description="Create your first device."
        actionLabel="Add Device"
        onAction={handleAction}
      />,
    );

    const button = screen.getByRole("button", { name: /add device/i });
    expect(button).toBeInTheDocument();
  });

  it("calls onAction when action button is clicked", async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();

    render(
      <EmptyState
        title="No devices"
        description="Create your first device."
        actionLabel="Add Device"
        onAction={handleAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add device/i }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("renders without action button", () => {
    render(
      <EmptyState
        title="No data"
        description="There is no data available."
      />,
    );

    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
