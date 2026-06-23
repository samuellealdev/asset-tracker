import type { Event, CreateEventInput } from "@/lib/schemas/event";

const API_BASE = "/api/node";

async function authFetch<T>(
  url: string,
  options: RequestInit,
  token: string,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  const body = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    throw { status: response.status, body };
  }

  return body as T;
}

export async function getEvents(
  deviceId: string,
  token: string,
): Promise<Event[]> {
  const url = `${API_BASE}/events?deviceId=${encodeURIComponent(deviceId)}`;
  return authFetch<Event[]>(url, { method: "GET" }, token);
}

export async function createEvent(
  data: CreateEventInput,
  token: string,
): Promise<Event> {
  return authFetch<Event>(
    `${API_BASE}/events`,
    { method: "POST", body: JSON.stringify(data) },
    token,
  );
}

export async function getDeletedDevices(token: string): Promise<Event[]> {
  const url = `${API_BASE}/events?type=device.deleted`;
  return authFetch<Event[]>(url, { method: "GET" }, token);
}
