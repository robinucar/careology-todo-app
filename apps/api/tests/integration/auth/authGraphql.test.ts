import { describe, expect, it } from "vitest";

import { hashPassword } from "../../../src/auth/password.js";
import * as authFixtures from "../../fixtures/auth.js";
import * as authGraphql from "../../fixtures/authGraphql.js";
import * as graphQLTest from "../../helpers/graphql.js";

graphQLTest.registerGraphQLTestCleanup();

describe("auth GraphQL integration", () => {
  it("registers a new user through GraphQL", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const user = authFixtures.createMockPrismaUser();

    user.findUnique.mockResolvedValue(null);
    user.create.mockResolvedValue(authFixtures.createAuthUser());

    const response = await server.executeOperation<
      authGraphql.RegisterMutationData
    >(
      {
        query: authGraphql.REGISTER_MUTATION,
        variables: {
          input: {
            email: authFixtures.authFixture.emailInput,
            password: authFixtures.authFixture.password,
          },
        },
      },
      {
        contextValue: authFixtures.createMockGraphQLContext(user),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.register.user).toEqual(authFixtures.createAuthUser());
    expect(result.data?.register.token).toEqual(expect.any(String));
    expect(result.data?.register.token.length).toBeGreaterThan(20);
    expect(user.findUnique).toHaveBeenCalledWith({
      where: {
        email: authFixtures.authFixture.email,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
    expect(user.create).toHaveBeenCalledWith({
      data: {
        email: authFixtures.authFixture.email,
        passwordHash: expect.stringMatching(/^\$2[aby]\$12\$/),
      },
      select: {
        id: true,
        email: true,
      },
    });
  });

  it("logs in an existing user through GraphQL", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const user = authFixtures.createMockPrismaUser();
    const passwordHash = await hashPassword(authFixtures.authFixture.password);

    user.findUnique.mockResolvedValue(
      authFixtures.createAuthUserWithPasswordHash(passwordHash),
    );

    const response = await server.executeOperation<
      authGraphql.LoginMutationData
    >(
      {
        query: authGraphql.LOGIN_MUTATION,
        variables: {
          input: {
            email: authFixtures.authFixture.emailInput,
            password: authFixtures.authFixture.password,
          },
        },
      },
      {
        contextValue: authFixtures.createMockGraphQLContext(user),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.login.user).toEqual(authFixtures.createAuthUser());
    expect(result.data?.login.token).toEqual(expect.any(String));
    expect(result.data?.login.token.length).toBeGreaterThan(20);
    expect(user.create).not.toHaveBeenCalled();
  });

  it("returns a safe error for invalid login credentials", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const user = authFixtures.createMockPrismaUser();
    const passwordHash = await hashPassword(authFixtures.authFixture.password);

    user.findUnique.mockResolvedValue(
      authFixtures.createAuthUserWithPasswordHash(passwordHash),
    );

    const response = await server.executeOperation(
      {
        query: authGraphql.LOGIN_MUTATION,
        variables: {
          input: {
            email: authFixtures.authFixture.email,
            password: authFixtures.authFixture.wrongPassword,
          },
        },
      },
      {
        contextValue: authFixtures.createMockGraphQLContext(user),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.data).toBeNull();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: "Invalid email or password.",
        extensions: {
          code: "INVALID_CREDENTIALS",
        },
      }),
    ]);
  });

  it("returns a safe error for duplicate registration", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const user = authFixtures.createMockPrismaUser();

    user.findUnique.mockResolvedValue(
      authFixtures.createAuthUserWithPasswordHash("stored-password-hash"),
    );

    const response = await server.executeOperation(
      {
        query: authGraphql.REGISTER_MUTATION,
        variables: {
          input: {
            email: authFixtures.authFixture.email,
            password: authFixtures.authFixture.password,
          },
        },
      },
      {
        contextValue: authFixtures.createMockGraphQLContext(user),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.data).toBeNull();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: "An account with this email already exists.",
        extensions: {
          code: "EMAIL_ALREADY_EXISTS",
        },
      }),
    ]);
    expect(user.create).not.toHaveBeenCalled();
  });
});
