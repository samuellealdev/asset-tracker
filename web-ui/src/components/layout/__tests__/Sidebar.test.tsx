import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../Sidebar";

const mockMatchRoute = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
  useMatchRoute: () => mockMatchRoute,
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all navigation links", () => {
    render(<Sidebar />);

    expect(screen.getByText("Devices")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Dashboards")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders links with correct hrefs", () => {
    render(<Sidebar />);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/devices");
    expect(hrefs).toContain("/events");
    expect(hrefs).toContain("/dashboards");
    expect(hrefs).toContain("/settings");
  });
});
