import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getEvents, createEvent, getDeletedDevices } from "@/lib/api/events";
import type { CreateEventInput } from "@/lib/schemas/event";

export function useEvents(deviceId?: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["events", deviceId],
    queryFn: () => getEvents(deviceId!, token!),
    staleTime: 30_000,
    enabled: !!token && !!deviceId,
  });
}

export function useCreateEvent() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeletedDevices() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["events", "device.deleted"],
    queryFn: () => getDeletedDevices(token!),
    staleTime: 30_000,
    enabled: !!token,
  });
}
