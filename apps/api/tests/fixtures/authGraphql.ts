export type RegisterMutationData = {
  register: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
};

export type LoginMutationData = {
  login: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
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
