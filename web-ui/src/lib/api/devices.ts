import type { Device, CreateDeviceInput, UpdateDeviceInput } from "@/lib/schemas/device";

const API_BASE = "/api/go";

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

export async function getDevices(token: string): Promise<Device[]> {
  return authFetch<Device[]>(`${API_BASE}/devices`, { method: "GET" }, token);
}

export async function getDevice(id: string, token: string): Promise<Device> {
  return authFetch<Device>(`${API_BASE}/devices/${id}`, { method: "GET" }, token);
}

export async function createDevice(
  input: CreateDeviceInput,
  token: string,
): Promise<Device> {
  return authFetch<Device>(
    `${API_BASE}/devices`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function updateDevice(
  id: string,
  input: UpdateDeviceInput,
  token: string,
): Promise<Device> {
  return authFetch<Device>(
    `${API_BASE}/devices/${id}`,
    { method: "PUT", body: JSON.stringify(input) },
    token,
  );
}

export async function deleteDevice(
  id: string,
  token: string,
): Promise<null> {
  return authFetch<null>(
    `${API_BASE}/devices/${id}`,
    { method: "DELETE" },
    token,
  );
}
