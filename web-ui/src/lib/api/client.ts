export interface ApiClientConfig {
  baseUrl?: string;
  token?: string;
}

export interface ApiError {
  status: number;
  body: unknown;
}

function getBaseUrl(config?: ApiClientConfig): string {
  if (config?.baseUrl) return config.baseUrl;
  return "";
}

function getToken(config?: ApiClientConfig): string | undefined {
  return config?.token;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as T;
  }

  const body = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    throw { status: response.status, body } as ApiError;
  }

  return body as T;
}

function buildHeaders(config?: ApiClientConfig): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = getToken(config);
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function createApiClient(config?: ApiClientConfig) {
  const baseUrl = getBaseUrl(config);

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers = buildHeaders(config);

    const options: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    return handleResponse<T>(response);
  }

  return {
    get<T>(path: string): Promise<T> {
      return request<T>("GET", path);
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>("POST", path, body);
    },
    put<T>(path: string, body?: unknown): Promise<T> {
      return request<T>("PUT", path, body);
    },
    delete<T>(path: string): Promise<T> {
      return request<T>("DELETE", path);
    },
  };
}
