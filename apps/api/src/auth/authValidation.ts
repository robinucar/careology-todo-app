import {
  AUTH_PASSWORD_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
} from "@careology/shared";
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(
    AUTH_PASSWORD_MIN_LENGTH,
    `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  );

const nameSchema = z
  .string()
  .trim()
  .min(
    USER_NAME_MIN_LENGTH,
    `Name must be at least ${USER_NAME_MIN_LENGTH} characters.`,
  )
  .max(
    USER_NAME_MAX_LENGTH,
    `Name must be at most ${USER_NAME_MAX_LENGTH} characters.`,
  );

export const registerInputSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
