import type { AuthPayload } from "@careology/shared";

export type RegisterMutationData = {
  register: AuthPayload;
};

export type LoginMutationData = {
  login: AuthPayload;
};

export const REGISTER_MUTATION = `#graphql
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const LOGIN_MUTATION = `#graphql
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;
