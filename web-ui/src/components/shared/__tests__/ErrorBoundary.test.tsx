import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "../ErrorBoundary";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("💥 KABOOM");
  }
  return <div>All good</div>;
}

beforeEach(() => {
  // Prevent the thrown error from polluting test output
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello world</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("catches render errors and shows fallback UI", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("does not show fallback UI when child does not throw", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("retry button resets error state for new non-throwing children", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <ErrorBoundary fallbackKey="test">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // First update the children to non-throwing version so when
    // ErrorBoundary resets, the new children render without error
    rerender(
      <ErrorBoundary fallbackKey="test">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    // Now click retry to reset error state and render new children
    await user.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
