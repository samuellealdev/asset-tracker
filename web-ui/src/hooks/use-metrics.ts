import { useQuery } from "@tanstack/react-query";
import { getMetrics } from "@/lib/api/metrics";

export function useGoMetrics() {
  return useQuery({
    queryKey: ["metrics", "go"],
    queryFn: () => getMetrics("go"),
    staleTime: 60_000,
  });
}

export function useNodeMetrics() {
  return useQuery({
    queryKey: ["metrics", "node"],
    queryFn: () => getMetrics("node"),
    staleTime: 60_000,
  });
}
