import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSkeleton } from "../LoadingSkeleton";

describe("LoadingSkeleton", () => {
  it("renders default skeleton with 3 rows", () => {
    render(<LoadingSkeleton />);

    const rows = screen.getAllByRole("status");
    expect(rows).toHaveLength(3);
  });

  it("renders custom number of rows", () => {
    render(<LoadingSkeleton rows={5} />);

    const rows = screen.getAllByRole("status");
    expect(rows).toHaveLength(5);
  });

  it("renders single row", () => {
    render(<LoadingSkeleton rows={1} />);

    const rows = screen.getAllByRole("status");
    expect(rows).toHaveLength(1);
  });

  it("renders with custom className", () => {
    const { container } = render(
      <LoadingSkeleton className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
