import { gql } from "apollo-server";

export const userTypeDefs = gql`
  type User {
    id: ID!
    email: String!
    username: String!
    fullName: String!
    password: String
    gender: String!
    profilePicture: String
    deletedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    transaction: [Transaction!]
  }
  enum Gender {
    male
    female
  }
  type LoginResponse {
    success: Boolean!
    message: String
    token: String
    user: User
  }
  type RegisterResponse {
    success: Boolean!
    message: String
    user: User
  }
  input NewUserInput {
    email: String!
    username: String!
    fullName: String!
    password: String!
    gender: Gender!
    profilePicture: String
  }
  input UpdateUserInput {
    email: String
    username: String
    fullName: String
    password: String
    gender: Gender
    profilePicture: String
  }
  enum UserOrder {
    createdAt_ASC
    createdAt_DESC
  }
  input UserFilter {
    id: ID
    username_regex: String
    email_regex: String
    fullName_regex: String
  }
  type Query {
    allUsers(
      filter: UserFilter
      first: Int
      skip: Int
      orderBy: UserOrder
      include: String
    ): [User!]!
    Me: User
  }
  type Mutation {
    createUser(input: NewUserInput!): RegisterResponse
    updateUser(id: String!, input: UpdateUserInput!): RegisterResponse
    deleteUser(id: ID!): CommonResponse
    login(username: String!, password: String!): LoginResponse!
  }
`;
