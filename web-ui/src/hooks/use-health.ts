import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api/health";

export function useGoHealth(refetchInterval: number = 30_000) {
  return useQuery({
    queryKey: ["health", "go"],
    queryFn: () => getHealth("go"),
    refetchInterval,
  });
}

export function useNodeHealth(refetchInterval: number = 30_000) {
  return useQuery({
    queryKey: ["health", "node"],
    queryFn: () => getHealth("node"),
    refetchInterval,
  });
}
