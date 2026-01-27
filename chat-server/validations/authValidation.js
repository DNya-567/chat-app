const Joi = require("joi");

/**
 * REGISTER VALIDATION
 *
 * Rules:
 * - username: 3-30 chars, alphanumeric + underscores/hyphens
 * - email: valid email format, max 100 chars
 * - password: min 6 chars (can enhance with uppercase/number requirement)
 */
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      "string.empty": "Username is required",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must not exceed 30 characters",
      "string.alphanum": "Username can only contain letters and numbers",
    }),

  email: Joi.string()
    .email()
    .max(100)
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Email must be a valid email address",
      "string.max": "Email must not exceed 100 characters",
    }),

  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password must not exceed 100 characters",
    }),
});

/**
 * LOGIN VALIDATION
 *
 * Rules:
 * - email: valid email format
 * - password: not empty, at least 6 chars
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Email must be a valid email address",
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
