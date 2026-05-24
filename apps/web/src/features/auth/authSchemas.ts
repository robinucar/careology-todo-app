import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .toLowerCase()

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')

const usernameSchema = z
  .string()
  .trim()
  .min(2, 'Username must be at least 2 characters.')
  .max(80, 'Username must be at most 80 characters.')

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

export const toLoginInput = (values: LoginFormValues) => {
  return {
    email: values.email,
    password: values.password,
  }
}

export const toRegisterInput = (values: RegisterFormValues) => {
  return {
    name: values.username,
    email: values.email,
    password: values.password,
  }
}
