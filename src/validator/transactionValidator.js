import Joi from "joi";

const transactionSchema = Joi.object({
  amount: Joi.number().greater(0).required(),
  description: Joi.string().min(1).max(255).required(),
  category: Joi.string().valid("expense", "investment", "saving").required(),
  paymentType: Joi.string().valid("card", "cash").required(),
  date: Joi.date().iso().required(),
  location: Joi.string().optional().allow(""),
});

export function validateTransactionInput(args) {
  const { error } = transactionSchema.validate(args, { abortEarly: false });
  if (error) {
    return error.details.reduce((acc, detail) => {
      acc[detail.path[0]] = detail.message;
      return acc;
    }, {});
  }
  return null;
}
