import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api/health";

export function useGoHealth() {
  return useQuery({
    queryKey: ["health", "go"],
    queryFn: () => getHealth("go"),
    refetchInterval: 30_000,
  });
}

export function useNodeHealth() {
  return useQuery({
    queryKey: ["health", "node"],
    queryFn: () => getHealth("node"),
    refetchInterval: 30_000,
  });
}
