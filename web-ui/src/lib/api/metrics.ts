type MetricsData = Record<string, unknown>;

const SERVICE_MAP = {
  go: "/api/go/metrics",
  node: "/api/node/metrics",
} as const;

export async function getMetrics(
  service: "go" | "node",
): Promise<MetricsData> {
  const url = SERVICE_MAP[service];

  let response: Response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch {
    throw new TypeError(`Failed to fetch ${service} metrics`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TypeError(`Failed to fetch ${service} metrics`);
  }

  if (!response.ok) {
    throw { status: response.status, body };
  }

  return body as MetricsData;
}
