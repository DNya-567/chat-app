const router = require("express").Router();
const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const { validate, validateParams } = require("../middleware/validate");
const { createChatSchema, getChatsByUserSchema } = require("../validations/chatValidation");

/**
 * @swagger
 * /api/chat/create:
 *   post:
 *     summary: Create a new chat
 *     description: Create a new 1-on-1 chat between two users or get existing chat
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otherUserId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: Current user ID (MongoDB ObjectId)
 *               otherUserId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439012
 *                 description: Other user ID (must be different from userId)
 *     responses:
 *       200:
 *         description: Chat created or retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Validation error (invalid IDs or same user)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/* -------------------- CREATE CHAT -------------------- */
router.post("/create", validate(createChatSchema), async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;

    // ✅ Input already validated by middleware
    // Always store participants sorted
    const participants = [userId, otherUserId].map(String).sort();

    let chat = await Chat.findOne({ participants });

    if (!chat) {
      chat = await Chat.create({ participants });
    }

    const populatedChat = await Chat.findById(chat._id).populate(
      "participants",
      "_id username avatar email"
    );

    // ✅ IMPORTANT: do NOT emit sockets from HTTP routes
    return res.status(200).json(populatedChat);
  } catch (err) {
    console.error("[chat-create] error:", err);
    return res.status(500).json({ message: "Failed to create chat" });
  }
});

/**
 * @swagger
 * /api/chat/my/{userId}:
 *   get:
 *     summary: Get all chats for a user
 *     description: Retrieve all chats the user is a participant in, sorted by most recent
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 507f1f77bcf86cd799439011
 *         description: User ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: List of chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Validation error (invalid user ID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/* -------------------- GET MY CHATS -------------------- */
router.get("/my/:userId", validateParams(getChatsByUserSchema), async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Input already validated by middleware
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "_id username avatar email")
      .sort({ updatedAt: -1 });

    return res.json(chats);
  } catch (err) {
    console.error("[chat-my] error:", err);
    return res.status(500).json({ message: "Failed to fetch chats" });
  }
});

module.exports = router;
