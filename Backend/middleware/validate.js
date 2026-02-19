import Joi from "joi";
import ExpressError from "../utils/ExpressError.js";

const userSchema = Joi.object({
  name: Joi.string().min(3).required(),
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  bio: Joi.string().max(160).allow(""),
  avatar: Joi.string().allow(""),
  website: Joi.string().uri().allow(""),
  socialLinks: Joi.object({
    github: Joi.string().uri().allow(""),
    linkedin: Joi.string().uri().allow(""),
    twitter: Joi.string().uri().allow(""),
    instagram: Joi.string().uri().allow(""),
  }).allow(null),
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
