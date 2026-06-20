import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

import { SettingsPanel } from "../SettingsPanel";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("SettingsPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("does not render when isOpen is false", () => {
    render(<SettingsPanel isOpen={false} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByTestId("settings-panel")).not.toBeInTheDocument();
  });

  it("renders panel and backdrop when isOpen is true", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId("settings-backdrop")).toBeInTheDocument();
    expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
  });

  it("renders API Base URL section with default values", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/go api/i)).toBeInTheDocument();
    expect(screen.getByText(/node.*api/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("http://localhost:8080")).toBeInTheDocument();
    expect(screen.getByDisplayValue("http://localhost:3000")).toBeInTheDocument();
  });

  it("displays unauthenticated status when no token", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/not authenticated/i)).toBeInTheDocument();
  });

  it("displays authenticated status with token preview when token exists", () => {
    localStorage.setItem("auth_token", "my-secret-jwt-token-12345");

    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/authenticated/i)).toBeInTheDocument();
    // Token preview - first/last few chars
    expect(screen.getByText(/my-se/)).toBeInTheDocument();
  });

  it("renders Polling Intervals section with default values", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/polling intervals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/health check every/i)).toHaveValue(2000);
    expect(screen.getByLabelText(/metrics refresh every/i)).toHaveValue(5000);
  });

  it("saves polling intervals when Save Intervals is clicked", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    const healthInput = screen.getByLabelText(/health check every/i);
    const metricsInput = screen.getByLabelText(/metrics refresh every/i);

    await user.clear(healthInput);
    await user.type(healthInput, "3000");
    await user.clear(metricsInput);
    await user.type(metricsInput, "7000");

    await user.click(screen.getByRole("button", { name: /save intervals/i }));

    expect(localStorage.getItem("healthInterval")).toBe("3000");
    expect(localStorage.getItem("metricsInterval")).toBe("7000");
  });

  it("shows validation error when interval is below 1000ms", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    const healthInput = screen.getByLabelText(/health check every/i);

    await user.clear(healthInput);
    await user.type(healthInput, "500");

    await user.click(screen.getByRole("button", { name: /save intervals/i }));

    expect(
      screen.getByTestId("health-interval-error"),
    ).toHaveTextContent(/minimum 1000ms/i);
    expect(localStorage.getItem("healthInterval")).toBeNull();
  });

  it("persists intervals across panel reopen via localStorage", () => {
    localStorage.setItem("healthInterval", "4000");
    localStorage.setItem("metricsInterval", "8000");

    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText(/health check every/i)).toHaveValue(4000);
    expect(screen.getByLabelText(/metrics refresh every/i)).toHaveValue(8000);
  });

  it("closes when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<SettingsPanel isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(<SettingsPanel isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("settings-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape key press", () => {
    const onClose = vi.fn();
    render(<SettingsPanel isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders a logout button", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByRole("button", { name: /logout/i }),
    ).toBeInTheDocument();
  });

  it("calls logout and navigates to /login on logout click", async () => {
    localStorage.setItem("auth_token", "test-jwt");
    const onClose = vi.fn();

    render(<SettingsPanel isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
    expect(onClose).toHaveBeenCalled();
  });
});
