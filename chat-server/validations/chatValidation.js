const Joi = require("joi");

/**
 * CREATE CHAT VALIDATION
 *
 * Rules:
 * - userId: valid MongoDB ObjectId
 * - otherUserId: valid MongoDB ObjectId
 * - Cannot be the same as userId
 */
const createChatSchema = Joi.object({
  userId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "userId is required",
      "string.pattern.base": "userId must be a valid MongoDB ID",
    }),

  otherUserId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "otherUserId is required",
      "string.pattern.base": "otherUserId must be a valid MongoDB ID",
    }),
}).custom((value, helpers) => {
  if (value.userId === value.otherUserId) {
    return helpers.error("any.invalid");
  }
  return value;
}, "Validate userId !== otherUserId")
.messages({
  "any.invalid": "Cannot create chat with yourself",
});

/**
 * GET CHATS VALIDATION
 *
 * Rules:
 * - userId: valid MongoDB ObjectId
 */
const getChatsByUserSchema = Joi.object({
  userId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "userId is required",
      "string.pattern.base": "userId must be a valid MongoDB ID",
    }),
});

/**
 * SEND MESSAGE VALIDATION
 *
 * Rules:
 * - chatId: valid MongoDB ObjectId
 * - text: non-empty string, max 5000 chars
 */
const sendMessageSchema = Joi.object({
  chatId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "chatId is required",
      "string.pattern.base": "chatId must be a valid MongoDB ID",
    }),

  text: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      "string.empty": "Message cannot be empty",
      "string.min": "Message cannot be empty",
      "string.max": "Message must not exceed 5000 characters",
    }),
});

/**
 * ADD REACTION VALIDATION
 *
 * Rules:
 * - messageId: valid MongoDB ObjectId
 * - emoji: non-empty string (emoji character)
 */
const addReactionSchema = Joi.object({
  messageId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "messageId is required",
      "string.pattern.base": "messageId must be a valid MongoDB ID",
    }),

  emoji: Joi.string()
    .trim()
    .min(1)
    .max(10)
    .required()
    .messages({
      "string.empty": "Emoji is required",
      "string.min": "Emoji cannot be empty",
    }),
});

module.exports = {
  createChatSchema,
  getChatsByUserSchema,
  sendMessageSchema,
  addReactionSchema,
};
