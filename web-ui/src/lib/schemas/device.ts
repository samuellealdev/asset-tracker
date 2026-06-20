import { z } from "zod";

export const deviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.string(),
  createdAt: z.string(),
});

export type Device = z.infer<typeof deviceSchema>;

export const createDeviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;

export const updateDeviceSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  type: z.string().min(1, "Type is required").optional(),
});

export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
