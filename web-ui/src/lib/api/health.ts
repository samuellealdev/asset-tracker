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

  let response: Response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch {
    throw new TypeError(`Failed to fetch ${service} health`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TypeError(`Failed to fetch ${service} health`);
  }

  if (!response.ok) {
    throw { status: response.status, body };
  }

  return body as HealthResponse;
}
