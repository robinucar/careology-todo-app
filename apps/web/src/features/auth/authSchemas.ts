import {
  AUTH_PASSWORD_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  type LoginInput,
  type RegisterInput,
} from '@careology/shared'
import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .toLowerCase()

const passwordSchema = z
  .string()
  .min(
    AUTH_PASSWORD_MIN_LENGTH,
    `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  )

const usernameSchema = z
  .string()
  .trim()
  .min(
    USER_NAME_MIN_LENGTH,
    `Username must be at least ${USER_NAME_MIN_LENGTH} characters.`,
  )
  .max(
    USER_NAME_MAX_LENGTH,
    `Username must be at most ${USER_NAME_MAX_LENGTH} characters.`,
  )

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean(),
})

export const registerFormSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>

export const toLoginInput = (values: LoginFormValues): LoginInput => {
  return {
    email: values.email,
    password: values.password,
  }
}

export const toRegisterInput = (values: RegisterFormValues): RegisterInput => {
  return {
    name: values.username,
    email: values.email,
    password: values.password,
  }
}
