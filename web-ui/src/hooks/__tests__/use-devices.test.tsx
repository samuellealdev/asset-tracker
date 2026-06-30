import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import {
  useDevices,
  useDevice,
  useCreateDevice,
  useUpdateDevice,
  useDeleteDevice,
} from "../use-devices";
import type { ReactNode } from "react";

vi.mock("@/lib/api/devices", () => ({
  getDevices: vi.fn(),
  getDevice: vi.fn(),
  createDevice: vi.fn(),
  updateDevice: vi.fn(),
  deleteDevice: vi.fn(),
}));

import * as devicesApi from "@/lib/api/devices";

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
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("useDevices", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("fetches devices list on mount when authenticated", async () => {
    const mockDevices = [
      { id: "1", name: "Device 1", type: "laptop", createdAt: "2024-01-01" },
      { id: "2", name: "Device 2", type: "server", createdAt: "2024-01-02" },
    ];
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(devicesApi.getDevices).mockResolvedValueOnce(mockDevices);

    const { result } = renderHook(() => useDevices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDevices);
    expect(devicesApi.getDevices).toHaveBeenCalledWith("test-token");
  });

  it("returns empty array when no devices exist", async () => {
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(devicesApi.getDevices).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useDevices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it("surfaces error when fetch fails", async () => {
    localStorage.setItem("auth_token", "test-token");
    const error = { status: 500, body: { error: "Server error" } };
    vi.mocked(devicesApi.getDevices).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDevices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDevice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("fetches a single device by id when authenticated", async () => {
    const mockDevice = {
      id: "1",
      name: "Device 1",
      type: "laptop",
      createdAt: "2024-01-01",
    };
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(devicesApi.getDevice).mockResolvedValueOnce(mockDevice);

    const { result } = renderHook(() => useDevice("1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDevice);
    expect(devicesApi.getDevice).toHaveBeenCalledWith("1", "test-token");
  });

  it("returns error when device is not found", async () => {
    localStorage.setItem("auth_token", "test-token");
    const error = { status: 404, body: { error: "Not found" } };
    vi.mocked(devicesApi.getDevice).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDevice("nonexistent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useCreateDevice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("posts new device and returns created device", async () => {
    const newDevice = {
      id: "3",
      name: "New Device",
      type: "server",
      createdAt: "2024-01-03",
    };
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(devicesApi.createDevice).mockResolvedValueOnce(newDevice);

    const { result } = renderHook(() => useCreateDevice(), {
      wrapper: createWrapper(),
    });

    const data = await act(async () => {
      return result.current.mutateAsync({
        name: "New Device",
        type: "server",
      });
    });

    expect(devicesApi.createDevice).toHaveBeenCalledWith(
      { name: "New Device", type: "server" },
      "test-token",
    );
    expect(data).toEqual(newDevice);

    await waitFor(() => {
      expect(result.current.data).toEqual(newDevice);
    });
  });

  it("surfaces error on failed create", async () => {
    localStorage.setItem("auth_token", "test-token");
    const error = { status: 400, body: { error: "Bad request" } };
    vi.mocked(devicesApi.createDevice).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateDevice(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ name: "", type: "" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUpdateDevice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("updates device by id and returns updated device", async () => {
    const updatedDevice = {
      id: "1",
      name: "Updated Name",
      type: "laptop",
      createdAt: "2024-01-01",
    };
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(devicesApi.updateDevice).mockResolvedValueOnce(updatedDevice);

    const { result } = renderHook(() => useUpdateDevice(), {
      wrapper: createWrapper(),
    });

    const data = await act(async () => {
      return result.current.mutateAsync({ id: "1", name: "Updated Name", type: "laptop" });
    });

    expect(devicesApi.updateDevice).toHaveBeenCalledWith(
      "1",
      { name: "Updated Name", type: "laptop" },
      "test-token",
    );
    expect(data).toEqual(updatedDevice);

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedDevice);
    });
  });
});

describe("useDeleteDevice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("deletes device by id on mutate", async () => {
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(devicesApi.deleteDevice).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useDeleteDevice(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("1");
    });

    expect(devicesApi.deleteDevice).toHaveBeenCalledWith("1", "test-token");
  });

  it("surfaces error on failed delete", async () => {
    localStorage.setItem("auth_token", "test-token");
    const error = { status: 404, body: { error: "Not found" } };
    vi.mocked(devicesApi.deleteDevice).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDeleteDevice(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate("nonexistent");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
