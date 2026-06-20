import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HealthCard } from "../HealthCard";

describe("HealthCard", () => {
  it("renders service name and port", () => {
    render(
      <HealthCard
        name="Go API"
        port={8080}
        isHealthy={true}
        dbStatus="connected"
        isLoading={false}
      />,
    );

    expect(screen.getByText("Go API")).toBeInTheDocument();
    expect(screen.getByText(":8080")).toBeInTheDocument();
  });

  it("shows green indicator when healthy", () => {
    const { container } = render(
      <HealthCard
        name="Go API"
        port={8080}
        isHealthy={true}
        dbStatus="connected"
        isLoading={false}
      />,
    );

    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(container.querySelector(".bg-green-500")).toBeTruthy();
  });

  it("shows red indicator when unhealthy", () => {
    const { container } = render(
      <HealthCard
        name="Go API"
        port={8080}
        isHealthy={false}
        dbStatus="disconnected"
        isLoading={false}
      />,
    );

    expect(screen.getByText(/unhealthy/i)).toBeInTheDocument();
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
    expect(container.querySelector(".bg-red-500")).toBeTruthy();
  });

  it("shows loading skeleton when isLoading", () => {
    const { container } = render(
      <HealthCard
        name="Go API"
        port={8080}
        isHealthy={false}
        dbStatus=""
        isLoading={true}
      />,
    );

    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });
});
