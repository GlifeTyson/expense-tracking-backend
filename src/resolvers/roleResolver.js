import { prisma } from "../connectDb/db.js";
import buildMongoFilters from "../utils/buildMongoFilters.js";
import buildMongoOrders from "../utils/buildMongoOrders.js";

export const roleResolvers = {
  Query: {
    allRoles: async (_, args, context) => {
      try {
        const { filter = {}, skip, first, orderBy } = args;
        const filters = buildMongoFilters(filter);
        return await prisma.role.findMany({
          where: filters,
          skip: skip || 0,
          take: first || 10,
          orderBy: buildMongoOrders(orderBy),
        });
      } catch (error) {
        throw new Error(error);
      }
    },
    role: async (_, { id }, context) => {},
  },
  Mutation: {
    createRole: async (_, { input: args }, context) => {
      try {
        const { name, description } = args;
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        await prisma.role.create({
          data: {
            name: name,
            description: description || "",
          },
        });
        return {
          success: true,
          message: "Created role success",
        };
      } catch (error) {
        throw new Error(error);
      }
    },
    updateRole: async (_, { id, input: args }, context) => {},
    deleteRole: async (_, { id }, context) => {},
  },
};
