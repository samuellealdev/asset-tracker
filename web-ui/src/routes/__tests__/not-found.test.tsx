import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  createFileRoute: () => (config: any) => config,
}));

import { NotFoundPage } from "../$";

describe("NotFoundPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 404 heading", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("has a link back to /devices", () => {
    render(<NotFoundPage />);

    const link = screen.getByRole("link", { name: /go to devices/i });
    expect(link).toHaveAttribute("href", "/devices");
  });
});
