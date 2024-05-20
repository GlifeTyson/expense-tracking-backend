import { validateTransactionInput } from "../validator/transactionValidator.js";
import { prisma } from "../connectDb/db.js";
import buildMongoFilters from "../utils/buildMongoFilters.js";
import buildMongoOrders from "../utils/buildMongoOrders.js";
import { validateUpdateTransactionInput } from "../validator/updateTransactionValidator.js";

export const transactionResolvers = {
  Query: {
    allTransactions: async (_, args, context) => {
      try {
        const { filter = {}, skip, first, orderBy, include } = args;

        const includeItem = include
          ? include.split(",").reduce((acc, curr) => {
              acc[curr] = true;
              return acc;
            }, {})
          : {};

        const { authorizedUser } = context;

        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }

        const limit = first || 10;
        const offset = skip || 0;

        const filters = buildMongoFilters(filter);
        console.log("filters", filters);
        const orders = buildMongoOrders(orderBy);
        console.log("orders", orders);

        const transactions = await prisma.transaction.findMany({
          where: filters,
          orderBy: orders,
          skip: offset,
          take: limit,
          include: includeItem,
        });

        return transactions;
      } catch (error) {
        throw new Error(error);
      }
    },
    transaction: async (_, { id }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }

        return await prisma.transaction.findUnique({ where: { id: id } });
      } catch (error) {
        throw new Error(error);
      }
    },
    myTransactions: async (_, __, context) => {
      try {
        const { authorizedUser } = context;

        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        return await prisma.transaction.findMany({
          where: {
            userId: authorizedUser.id,
          },
          include: {
            user: true,
          },
        });
      } catch (error) {
        throw new Error(error);
      }
    },
    categoryStatistics: async (_, __, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const transactions = await prisma.transaction.findMany({
          where: { userId: authorizedUser.id },
        });
        const categoryMap = {};

        transactions &&
          transactions.map((transaction) => {
            if (!categoryMap[transaction.category]) {
              categoryMap[transaction.category] = 0;
            }
            categoryMap[transaction.category] += transaction.amount;
          });

        return Object.keys(categoryMap).map((category) => ({
          category,
          totalAmount: categoryMap[category],
        }));
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  Mutation: {
    createTransaction: async (_, { input: args }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const validateError = validateTransactionInput(args);
        if (validateError) {
          throw new Error(Object.values(validateError).join(","));
        }
        const transaction = await prisma.transaction.create({
          data: {
            ...args,
            userId: authorizedUser.id,
          },
        });
        return {
          success: true,
          message: "Created transaction success",
        };
      } catch (error) {
        throw new Error(error);
      }
    },
    updateTransaction: async (_, { id, input: args }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const validateError = validateUpdateTransactionInput(args);
        if (validateError) {
          throw new Error(Object.values(validateError).join(","));
        }
        const transaction = await prisma.transaction.findUnique({
          where: { id: String(id), deletedAt: { isSet: false } },
        });
        if (!transaction) {
          throw new Error("Transaction not found");
        }
        await prisma.transaction.update({
          where: { id: String(id) },
          data: args,
        });
        return {
          success: true,
          message: "Updated transaction success",
        };
      } catch (error) {
        throw new Error(error);
      }
    },
    deleteTransaction: async (_, { id }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const transaction = await prisma.transaction.findUnique({
          where: { id: String(id), deletedAt: { isSet: false } },
        });
        if (!transaction) {
          throw new Error("Transaction not found");
        }
        await prisma.transaction.update({
          where: { id: String(id) },
          data: { deletedAt: new Date() },
        });
        return {
          success: true,
          message: "Deleted transaction success",
        };
      } catch (error) {
        throw new Error(error);
      }
    },
  },
};
