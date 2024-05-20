import Joi from "joi";

const transactionSchema = Joi.object({
  amount: Joi.number().greater(0).optional(),
  description: Joi.string().min(1).max(255).optional(),
  category: Joi.string().valid("expense", "investment", "saving").optional(),
  paymentType: Joi.string().valid("card", "cash").optional(),
  date: Joi.date().iso().optional(),
  location: Joi.string().optional(),
});

export function validateUpdateTransactionInput(args) {
  const { error } = transactionSchema.validate(args, { abortEarly: false });
  if (error) {
    return error.details.reduce((acc, detail) => {
      acc[detail.path[0]] = detail.message;
      return acc;
    }, {});
  }
  return null;
}
