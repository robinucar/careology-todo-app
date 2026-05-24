import type { AuthSession, AuthSessionUser } from '../../app/authSession'

export type AuthUser = AuthSessionUser
export type AuthPayload = AuthSession

export type LoginMutationData = {
  login: AuthPayload
}

export type LoginMutationVariables = {
  input: {
    email: string
    password: string
  }
}

export type RegisterMutationData = {
  register: AuthPayload
}

export type RegisterMutationVariables = {
  input: {
    name: string
    email: string
    password: string
  }
}
