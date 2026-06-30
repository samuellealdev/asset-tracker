import { useQuery } from "@tanstack/react-query";
import { getMetrics, getMetricsDetail } from "@/lib/api/metrics";

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

export function useGoMetricsDetail(refetchInterval: number = 10_000) {
  return useQuery({
    queryKey: ["metrics-detail", "go"],
    queryFn: () => getMetricsDetail("go"),
    staleTime: 10_000,
    refetchInterval,
    retry: false,
  });
}

export function useNodeMetricsDetail(refetchInterval: number = 10_000) {
  return useQuery({
    queryKey: ["metrics-detail", "node"],
    queryFn: () => getMetricsDetail("node"),
    staleTime: 10_000,
    refetchInterval,
    retry: false,
  });
}
