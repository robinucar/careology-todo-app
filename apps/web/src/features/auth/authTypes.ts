import type {
  AuthPayload,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '@careology/shared'

export type { AuthPayload, AuthUser }

export type LoginMutationData = {
  login: AuthPayload
}

export type LoginMutationVariables = {
  input: LoginInput
}

export type RegisterMutationData = {
  register: AuthPayload
}

export type RegisterMutationVariables = {
  input: RegisterInput
}
