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

export interface RequestTrace {
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  timestamp: string;
}

export interface MetricsDetail {
  requests_total: number;
  errors_total: number;
  recent: RequestTrace[];
}

const DETAIL_MAP = {
  go: "/api/go/metrics/requests",
  node: "/api/node/metrics/requests",
} as const;

interface GetMetricsDetailOpts {
  limit?: number;
  signal?: AbortSignal;
}

export async function getMetricsDetail(
  service: "go" | "node",
  opts?: GetMetricsDetailOpts,
): Promise<MetricsDetail> {
  const baseUrl = DETAIL_MAP[service];
  const params = new URLSearchParams();
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
  const url = params.size > 0 ? `${baseUrl}?${params}` : baseUrl;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      signal: opts?.signal,
    });
  } catch {
    throw new TypeError(`Failed to fetch ${service} metrics detail`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TypeError(`Failed to fetch ${service} metrics detail`);
  }

  if (!response.ok) {
    throw { status: response.status, body };
  }

  return body as MetricsDetail;
}
