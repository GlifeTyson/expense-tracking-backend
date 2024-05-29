import { gql } from "apollo-server";

export const transactionTypeDefs = gql`
  type Transaction {
    id: ID!
    userId: String!
    amount: Float!
    description: String!
    category: String!
    paymentType: String!
    date: DateTime!
    location: String
    createdAt: DateTime!
    updatedAt: DateTime!
    deletedAt: DateTime
    user: User
  }
  enum TransactionOrder {
    createdAt_DESC
    createdAt_ASC
    amount_DESC
    amount_ASC
    date_DESC
    date_ASC
  }
  type CategoryStatistics {
    category: String!
    totalAmount: Float!
  }
  type Query {
    allTransactions(
      filter: FilterTransaction
      first: Int
      skip: Int
      orderBy: TransactionOrder
      include: String
    ): [Transaction!]
    transaction(id: ID!): Transaction
    myTransactions(
      filter: FilterTransaction
      first: Int
      skip: Int
      orderBy: TransactionOrder
    ): [Transaction!]
    categoryStatistics: [CategoryStatistics!]
  }
  input FilterTransaction {
    amount: Float
    content_regex: String
    userId: ID
    description_regex: String
  }
  input NewTransactionInput {
    amount: Float!
    description: String!
    category: String!
    paymentType: String!
    date: DateTime!
    location: String
  }
  input UpdateTransactionInput {
    amount: Float
    description: String
    category: String
    paymentType: String
    date: DateTime
    location: String
  }
  type Mutation {
    createTransaction(input: NewTransactionInput!): CommonResponse
    updateTransaction(id: ID!, input: UpdateTransactionInput!): CommonResponse
    deleteTransaction(id: ID!): CommonResponse
  }
`;
