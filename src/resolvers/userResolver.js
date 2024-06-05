import { prisma } from "../connectDb/db.js";
import { validateUserInput } from "../validator/userValidator.js";
import { comparePassword, createTokens, hashPassword } from "../utils/auth.js";
import buildMongoFilters from "../utils/buildMongoFilters.js";
import buildMongoOrders from "../utils/buildMongoOrders.js";
import { io } from "../config/websocket.js";

export const userResolvers = {
  Query: {
    allUsers: async (parent, args, context) => {
      try {
        const { filter = {}, skip, first, orderBy, include } = args;
        const includeItem = {};

        if (include) {
          include.split(",").forEach((item) => {
            includeItem[item] = true;
          });
        }

        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const limit = first || 10;
        const offset = skip || 0;

        const filters = buildMongoFilters(filter);
        const ordersBy = buildMongoOrders(orderBy);

        const obj = await prisma.user.findMany({
          skip: offset,
          take: limit,
          where: filters,
          orderBy: ordersBy,
          include: include ? includeItem : {},
        });

        // for (const [key, value] of Object.entries(obj)) {
        //   obj[key].role = value.role.name;
        // }
        // console.log(obj);

        return obj;
      } catch (error) {
        throw new Error(error);
      }
    },
    Me: async (parent, args, context) => {
      const { authorizedUser } = context;
      if (!authorizedUser) {
        throw new Error("Unauthorized");
      }
      const me = await prisma.user.findUnique({
        where: { id: authorizedUser.id },
        include: {
          transaction: true,
          role: true,
        },
      });
      return me;
    },
  },
  Mutation: {
    createUser: async (parent, { input: args }, context) => {
      try {
        const { username, email, password, gender, fullName, role } = args;

        // Step 1: Validate input
        const validationErrors = validateUserInput(args);
        if (validationErrors) {
          throw new Error(
            Object.values(validationErrors)
              .map((error) => error.join(", "))
              .join("; ")
          );
        }

        // Step 2: Check if user already exists by email or username
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [{ username }, { email }],
            deletedAt: { isSet: false }, // assuming `deletedAt` is `null` when not deleted
          },
        });

        if (existingUser) {
          throw new Error("Username or email already exists");
        }

        // Step 3: Hash the password if provided
        const hashedPassword = hashPassword(password);

        // Step 4: Determine the profile picture based on gender
        const profilePicture =
          gender === "male"
            ? `https://avatar.iran.liara.run/public/boy?username=${username}`
            : `https://avatar.iran.liara.run/public/girl?username=${username}`;

        //Step 4.5 Create role for user
        const roleFound = await prisma.role.findFirst({
          where: {
            name: role,
          },
        });

        // Step 5: Create the new user
        const newUser = await prisma.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
            gender,
            fullName,
            profilePicture,
            roleId: roleFound.id,
          },
        });
        const newUserCreated = await prisma.user.findUnique({
          where: {
            id: newUser.id,
          },
        });
        io.emit("user-update", { type: "create", user: newUserCreated });
        return {
          success: true,
          user: newUser,
          message: "User created successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || "An error occurred during user creation",
        };
      }
    },

    login: async (parent, args, context) => {
      try {
        const { SECRET1 } = context;

        const { password, username } = args;
        const userCheck = await prisma.user.findFirst({
          where: {
            OR: [{ username: username }, { email: username }],
          },
        });
        if (!userCheck) {
          throw new Error("User not found");
        }
        const cpPassword = await comparePassword(password, userCheck.password);
        if (!cpPassword) {
          throw new Error("Wrong password");
        }

        const token = await createTokens({ user: userCheck, secret1: SECRET1 });

        return {
          success: true,
          token: token,
          user: userCheck,
          message: "Login successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || "An error occurred during login",
        };
      }
    },
    updateUser: async (parent, { id, input: args }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const validationErrors = validateUserInput(args);
        if (validationErrors) {
          throw new Error(
            Object.values(validationErrors)
              .map((error) => error.join(", "))
              .join("; ")
          );
        }
        // check if id is exist
        const userFound = await prisma.user.findUnique({
          where: {
            id: String(id),
          },
        });
        if (!userFound) {
          throw new Error("User not found");
        }

        const user = await prisma.user.update({
          where: {
            id: String(id),
          },
          data: args,
        });

        return {
          success: true,
          user: user,
          message: "User Updated Successfully",
        };
      } catch (error) {
        throw new Error(error);
      }
    },
    deleteUser: async (_, { id }, context) => {
      try {
        //check role if role admin then oke to delete
        const { authorizedUser } = context;

        const adminFound = await prisma.user.findFirst({
          where: {
            id: authorizedUser.id,
          },
          include: {
            role: true,
          },
        });
        if (adminFound.role.name !== "superadmin") {
          throw new Error("Unauthorized");
        }
        // check if id is exist
        const userFound = await prisma.user.findUnique({
          where: {
            id: id,
            deletedAt: { isSet: false },
          },
        });
        if (!userFound) {
          throw new Error("User not found");
        }
        await prisma.user.update({
          where: {
            id: id,
          },
          data: {
            deletedAt: new Date(),
          },
        });
        io.emit("user-update", { type: "delete", userId: userFound.id });
        return {
          success: true,
          message: "User Deleted Successfully",
          errors: null,
        };
      } catch (error) {
        throw new Error(error);
      }
    },
  },
};
