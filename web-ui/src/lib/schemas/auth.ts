import { z } from "zod";

export const loginRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const tokenResponseSchema = z.object({
  token: z.string(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;

export const errorResponseSchema = z.object({
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
