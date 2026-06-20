import type { TokenResponse } from "@/lib/schemas/auth";

const API_BASE = "/api/go";

export async function login(
  username: string,
  password: string,
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw { status: response.status, body };
  }

  return body as TokenResponse;
}
