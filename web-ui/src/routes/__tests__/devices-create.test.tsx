import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  createFileRoute: () => (config: any) => config,
}));

const mockMutateAsync = vi.fn();

vi.mock("@/hooks/use-devices", () => ({
  useCreateDevice: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

import { DeviceCreatePage } from "../devices.create";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("DeviceCreatePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({ id: "3", name: "New Device", type: "server", createdAt: "2024-01-03" });
  });

  it("renders create device form", () => {
    render(<DeviceCreatePage />, { wrapper: createWrapper() });

    expect(screen.getByText(/create new device/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create device/i })).toBeInTheDocument();
  });

  it("submits form and navigates to devices list on success", async () => {
    render(<DeviceCreatePage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/name/i), "New Device");
    await user.type(screen.getByLabelText(/type/i), "server");
    await user.click(screen.getByRole("button", { name: /create device/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: "New Device",
        type: "server",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/devices" });
  });

  it("shows error message when creation fails", async () => {
    mockMutateAsync.mockRejectedValueOnce({
      status: 400,
      body: { error: "Bad request" },
    });

    render(<DeviceCreatePage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/name/i), "New Device");
    await user.type(screen.getByLabelText(/type/i), "server");
    await user.click(screen.getByRole("button", { name: /create device/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create device/i)).toBeInTheDocument();
    });
  });
});
