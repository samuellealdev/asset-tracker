import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { useEvents, useCreateEvent } from "../use-events";
import type { ReactNode } from "react";

vi.mock("@/lib/api/events", () => ({
  getEvents: vi.fn(),
  createEvent: vi.fn(),
}));

import * as eventsApi from "@/lib/api/events";

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

const mockEvents = [
  {
    id: "evt-1",
    type: "device.created",
    deviceId: "dev-1",
    name: "Device created",
    timestamp: "2025-06-01T12:00:00Z",
    actor: "admin",
    description: "New device added",
  },
  {
    id: "evt-2",
    type: "device.updated",
    deviceId: "dev-2",
    name: "Device updated",
    timestamp: "2025-06-01T13:00:00Z",
    actor: "operator",
    description: "Firmware updated",
  },
];

describe("useEvents", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("fetches events for a device when authenticated", async () => {
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(eventsApi.getEvents).mockResolvedValueOnce(mockEvents);

    const { result } = renderHook(() => useEvents("dev-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEvents);
    expect(eventsApi.getEvents).toHaveBeenCalledWith("dev-1", "test-token");
  });

  it("returns empty array when no events exist", async () => {
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(eventsApi.getEvents).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useEvents("dev-1"), {
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
    vi.mocked(eventsApi.getEvents).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useEvents("dev-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("fetches all events when no deviceId is provided", async () => {
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(eventsApi.getEvents).mockResolvedValueOnce(mockEvents);

    const { result } = renderHook(() => useEvents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEvents);
  });

  it("does not fetch when not authenticated", async () => {
    const { result } = renderHook(() => useEvents("dev-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(eventsApi.getEvents).not.toHaveBeenCalled();
  });
});

describe("useCreateEvent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("posts new event and returns created event", async () => {
    const newEvent = {
      id: "evt-3",
      type: "device.created",
      deviceId: "dev-1",
      name: "New event",
      timestamp: "2025-06-01T14:00:00Z",
      actor: "admin",
      description: null,
    };
    localStorage.setItem("auth_token", "test-token");
    vi.mocked(eventsApi.createEvent).mockResolvedValueOnce(newEvent);

    const { result } = renderHook(() => useCreateEvent(), {
      wrapper: createWrapper(),
    });

    const data = await act(async () => {
      return result.current.mutateAsync({
        type: "device.created",
        deviceId: "dev-1",
        name: "New event",
      });
    });

    expect(eventsApi.createEvent).toHaveBeenCalledWith(
      { type: "device.created", deviceId: "dev-1", name: "New event" },
      "test-token",
    );
    expect(data).toEqual(newEvent);
  });

  it("surfaces error on failed create", async () => {
    localStorage.setItem("auth_token", "test-token");
    const error = { status: 400, body: { error: "Bad request" } };
    vi.mocked(eventsApi.createEvent).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateEvent(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ type: "", deviceId: "", name: "" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
