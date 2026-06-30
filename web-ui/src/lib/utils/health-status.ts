export type HealthStatus = "healthy" | "offline" | "unhealthy" | "stale";

function isFetchErrorMessage(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const obj = error as Record<string, unknown>;
  return (
    typeof obj.message === "string" &&
    obj.message.toLowerCase().includes("fetch")
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
