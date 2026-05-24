export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    completed: Boolean!
    dueDate: String
    tags: [String!]!
    order: Int!

    weatherCity: String
    weatherTemperature: Float
    weatherCondition: String
    weatherIconUrl: String
    weatherFetchedAt: String

    createdAt: String!
    updatedAt: String!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input TaskFiltersInput {
    search: String
    completed: Boolean
    tags: [String!]
    dueBefore: String
    dueAfter: String
  }

  input CreateTaskInput {
    title: String!
    description: String
    dueDate: String
    tags: [String!]
  }

  input UpdateTaskInput {
    title: String
    description: String
    completed: Boolean
    dueDate: String
    tags: [String!]
  }

  type Query {
    health: String!
    tasks(filters: TaskFiltersInput): [Task!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Task!
    reorderTasks(ids: [ID!]!): [Task!]!
  }
`;
