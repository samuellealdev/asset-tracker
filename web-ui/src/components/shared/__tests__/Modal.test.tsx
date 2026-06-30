import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../Modal";

describe("Modal", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders children and title when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders via portal into document.body", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Portal Test">
        <p>Portal content</p>
      </Modal>,
    );

    const title = screen.getByText("Portal Test");
    expect(title).toBeInTheDocument();
    expect(document.body.contains(title)).toBe(true);
  });

  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden Modal">
        <p>Should not be visible</p>
      </Modal>,
    );

    expect(screen.queryByText("Hidden Modal")).not.toBeInTheDocument();
    expect(screen.queryByText("Should not be visible")).not.toBeInTheDocument();
  });

  it("does not render when isOpen changes from true to false", () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Toggle">
        <p>Content</p>
      </Modal>,
    );

    expect(screen.getByText("Toggle")).toBeInTheDocument();

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Toggle">
        <p>Content</p>
      </Modal>,
    );

    expect(screen.queryByText("Toggle")).not.toBeInTheDocument();
  });

  it("renders close button and calls onClose when clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Close Test">
        <p>Content</p>
      </Modal>,
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Test">
        <p>Content</p>
      </Modal>,
    );

    const user = userEvent.setup();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Backdrop Test">
        <p>Content</p>
      </Modal>,
    );

    const user = userEvent.setup();
    // The backdrop is the div with the overlay class
    const backdrop = screen.getByTestId("modal-backdrop");
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when clicking inside the modal panel", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Inside Click">
        <p>Content inside</p>
      </Modal>,
    );

    const user = userEvent.setup();
    const panel = screen.getByTestId("modal-panel");
    await user.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("sets aria-modal and role attributes on dialog", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="ARIA Test">
        <p>Content</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
  });

  it("traps focus: Tab cycles through focusable elements within modal", async () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Focus Trap">
        <button>First</button>
        <button>Second</button>
      </Modal>,
    );

    const user = userEvent.setup();
    const closeButton = screen.getByRole("button", { name: /close/i });
    const firstButton = screen.getByText("First");
    const secondButton = screen.getByText("Second");

    // Close button is first focusable; Tab should move to "First"
    closeButton.focus();
    await user.tab();
    await waitFor(() => expect(firstButton).toHaveFocus());

    // Tab again should go to "Second"
    await user.tab();
    await waitFor(() => expect(secondButton).toHaveFocus());

    // Tab again should cycle back to close button
    await user.tab();
    await waitFor(() => expect(closeButton).toHaveFocus());
  });

  it("renders without a title when title is not provided", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>No title content</p>
      </Modal>,
    );

    expect(screen.getByText("No title content")).toBeInTheDocument();
    // Should still have a dialog role
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
