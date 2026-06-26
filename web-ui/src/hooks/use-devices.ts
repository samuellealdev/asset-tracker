import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
} from "@/lib/api/devices";
import type { CreateDeviceInput, UpdateDeviceInput } from "@/lib/schemas/device";

export function useDevices() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevices(token!),
    staleTime: 30_000,
    enabled: !!token,
  });
}

export function useDevice(id: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["devices", id],
    queryFn: () => getDevice(id, token!),
    staleTime: 30_000,
    enabled: !!token && !!id,
  });
}

export function useCreateDevice() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeviceInput) => createDevice(input, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export function useUpdateDevice() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: UpdateDeviceInput & { id: string }) => updateDevice(id, input, token!),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", variables.id] });
    },
  });
}

export function useDeleteDevice() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDevice(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      // Immediate invalidation for the fast path (event already in MongoDB)
      queryClient.invalidateQueries({
        queryKey: ["events", "device.deleted"],
      });
      // Delayed invalidation to account for Kafka propagation delay (~1s).
      // The Go backend publishes device.deleted to Kafka asynchronously;
      // the Node consumer needs time to persist it to MongoDB before
      // the deleted-devices query can return fresh data.
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["events", "device.deleted"],
        });
      }, 2_000);
    },
  });
}
