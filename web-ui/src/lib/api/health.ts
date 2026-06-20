interface HealthResponse {
  status: string;
  timestamp: string;
  [key: string]: unknown;
}

const SERVICE_MAP = {
  go: "/api/go/health/ready",
  node: "/api/node/health/ready",
} as const;

export async function getHealth(
  service: "go" | "node",
): Promise<HealthResponse> {
  const url = SERVICE_MAP[service];
  const response = await fetch(url, { method: "GET" });

  const body = await response.json();

  if (!response.ok) {
    throw { status: response.status, body };
  }

  return body as HealthResponse;
}
