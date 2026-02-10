import Joi from "joi";
import ExpressError from "../utils/ExpressError.js";

const userSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, message);
  } else {
    next();
  }
};

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    const message = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, message);
  } else {
    next();
  }
};
