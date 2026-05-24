import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export const registerInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;