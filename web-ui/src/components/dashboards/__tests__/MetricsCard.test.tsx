import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricsCard } from "../MetricsCard";

describe("MetricsCard", () => {
  it("renders metric labels and values", () => {
    render(
      <MetricsCard
        title="Go API"
        metrics={{ requests_total: 1500, errors_total: 12 }}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Go API")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/requests/i)).toBeInTheDocument();
    expect(screen.getByText(/errors/i)).toBeInTheDocument();
  });

  it("shows error state when metrics unavailable", () => {
    render(
      <MetricsCard
        title="Go API"
        metrics={{}}
        isLoading={false}
        isUnavailable={true}
      />,
    );

    expect(screen.getByText(/metrics unavailable/i)).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading", () => {
    const { container } = render(
      <MetricsCard
        title="Go API"
        metrics={{}}
        isLoading={true}
      />,
    );

    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("displays all known metric keys", () => {
    render(
      <MetricsCard
        title="Node API"
        metrics={{
          requests_total: 2500,
          errors_total: 5,
          uptime_seconds: 172800,
        }}
        isLoading={false}
      />,
    );

    expect(screen.getByText("2,500")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("172,800")).toBeInTheDocument();
  });
});
