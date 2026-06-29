import { useQuery } from "@tanstack/react-query";
import { getMetrics } from "@/lib/api/metrics";

export function useGoMetrics(refetchInterval: number = 30_000) {
  return useQuery({
    queryKey: ["metrics", "go"],
    queryFn: () => getMetrics("go"),
    staleTime: 60_000,
    refetchInterval,
    retry: false,
  });
}

export function useNodeMetrics(refetchInterval: number = 30_000) {
  return useQuery({
    queryKey: ["metrics", "node"],
    queryFn: () => getMetrics("node"),
    staleTime: 60_000,
    refetchInterval,
    retry: false,
  });
}
