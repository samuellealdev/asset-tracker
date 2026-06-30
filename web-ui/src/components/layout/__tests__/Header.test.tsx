import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

import { Header } from "../Header";

describe("Header", () => {
  it("renders the app title", () => {
    render(<Header />);

    expect(screen.getByText("Asset Tracker")).toBeInTheDocument();
  });
});
