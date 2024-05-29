import { gql } from "apollo-server";

export const roleTypeDefs = gql`
  type Role {
    id: ID!
    name: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
    deletedAt: DateTime
  }
  input NewRoleInput {
    name: String!
    description: String
  }
  input UpdateRoleInput {
    name: String
    description: String
  }
  input FilterRole {
    name_regex: String
    description_regex: String
  }
  enum RoleOrder {
    createdAt_DESC
    createdAt_ASC
  }
  type Query {
    allRoles(
      filter: FilterRole
      first: Int
      skip: Int
      orderBy: RoleOrder
    ): [Role!]!
    role(id: ID!): Role
  }
  type Mutation {
    createRole(input: NewRoleInput!): CommonResponse
    updateRole(id: ID!, input: UpdateRoleInput!): CommonResponse
    deleteRole(id: ID!): CommonResponse
  }
`;
