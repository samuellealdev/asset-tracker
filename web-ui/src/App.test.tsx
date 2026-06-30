import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Mock routeTree to avoid router initialization issues in tests
vi.mock("./routeTree.gen", () => ({
  routeTree: { addChildren: () => ({}) },
}));

vi.mock("@tanstack/react-router", () => ({
  createRouter: () => ({}),
  RouterProvider: ({ children }: any) => children ?? null,
}));

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

import App from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    // App should render without error
    expect(document.body.querySelector("div")).toBeTruthy();
  });
});
