const Joi = require("joi");

/**
 * GET USER BY ID VALIDATION
 *
 * Rules:
 * - id: valid MongoDB ObjectId
 */
const getUserByIdSchema = Joi.object({
  id: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "User ID is required",
      "string.pattern.base": "User ID must be a valid MongoDB ID",
    }),
});

/**
 * UPDATE PROFILE VALIDATION
 *
 * Rules:
 * - username: 3-30 chars, alphanumeric (optional)
 * - avatar: file upload (handled separately by multer)
 */
const updateProfileSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional()
    .messages({
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must not exceed 30 characters",
      "string.alphanum": "Username can only contain letters and numbers",
    }),
});

/**
 * SEARCH USERS VALIDATION
 *
 * Rules:
 * - query: non-empty string for username/email search
 * - limit: optional, number between 1-100
 */
const searchUsersSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.empty": "Search query is required",
      "string.min": "Search query cannot be empty",
      "string.max": "Search query must not exceed 100 characters",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      "number.min": "Limit must be at least 1",
      "number.max": "Limit must not exceed 100",
    }),
});

module.exports = {
  getUserByIdSchema,
  updateProfileSchema,
  searchUsersSchema,
};
