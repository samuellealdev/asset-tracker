type MetricsData = Record<string, unknown>;

const SERVICE_MAP = {
  go: "/api/go/metrics",
  node: "/api/node/metrics",
} as const;

export async function getMetrics(
  service: "go" | "node",
): Promise<MetricsData> {
  const url = SERVICE_MAP[service];
  const response = await fetch(url, { method: "GET" });

  const body = await response.json();

  if (!response.ok) {
    throw { status: response.status, body };
  }

  return body as MetricsData;
}
