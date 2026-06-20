import { z } from "zod";

export const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  deviceId: z.string(),
  name: z.string(),
  timestamp: z.string(),
  actor: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type Event = z.infer<typeof eventSchema>;

export const createEventSchema = z.object({
  type: z.string().min(1, "Type is required"),
  deviceId: z.string().min(1, "Device is required"),
  name: z.string().min(1, "Name is required"),
  actor: z.string().optional(),
  description: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
