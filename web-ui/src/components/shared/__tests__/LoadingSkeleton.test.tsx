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

  describe("grid variant", () => {
    it("renders correct count of card skeletons with role='status'", () => {
      render(<LoadingSkeleton variant="grid" count={4} />);

      const skeletons = screen.getAllByRole("status");
      expect(skeletons).toHaveLength(4);
    });

    it("renders responsive grid container classes", () => {
      const { container } = render(<LoadingSkeleton variant="grid" count={2} />);

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain("grid");
      expect(grid.className).toContain("grid-cols-1");
      expect(grid.className).toContain("sm:grid-cols-2");
      expect(grid.className).toContain("lg:grid-cols-3");
      expect(grid.className).toContain("xl:grid-cols-4");
    });

    it("default variant is 'rows' and ignores count", () => {
      render(<LoadingSkeleton count={2} />);

      // Default variant is "rows" which renders 3 rows by default
      const rows = screen.getAllByRole("status");
      expect(rows).toHaveLength(3);
    });
  });
});
