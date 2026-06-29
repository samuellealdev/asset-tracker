export type HealthStatus = "healthy" | "offline" | "unhealthy" | "stale";

function isFetchErrorMessage(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string" &&
    (error as Record<string, unknown>).message.toLowerCase().includes("fetch")
  );
}

export function classifyHealth(
  isError: boolean,
  data: { status: string } | undefined,
  error: unknown,
): HealthStatus {
  if (!isError && data?.status === "ok") {
    return "healthy";
  }

  if (isError) {
    if (error instanceof TypeError) {
      return "offline";
    }

    if (isFetchErrorMessage(error)) {
      return "offline";
    }

    if (data !== undefined) {
      return "stale";
    }

    return "unhealthy";
  }

  return "unhealthy";
}
