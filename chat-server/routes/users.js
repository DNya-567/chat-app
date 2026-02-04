const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const upload = require("../middleware/upload"); // multer (memory storage)
const auth = require("../middleware/auth"); // 🔐 JWT middleware
const { validateParams, validate } = require("../middleware/validate");
const { getUserByIdSchema, updateProfileSchema } = require("../validations/userValidation");

const router = express.Router();

/* -------------------- CLOUDINARY CONFIG -------------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve user profile information by user ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 507f1f77bcf86cd799439011
 *         description: User ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error (invalid user ID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/* -------------------- GET USER BY ID -------------------- */
router.get("/:id", validateParams(getUserByIdSchema), async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Input already validated by middleware
    const user = await User.findById(id).select(
      "_id username email avatar"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("[get-user] error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/users/update-profile:
 *   post:
 *     summary: Update user profile
 *     description: Update user profile information including username and avatar. Requires JWT authentication.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: newusername
 *                 description: New username (alphanumeric, 3-30 characters)
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (optional)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/* -------------------- UPDATE PROFILE (SECURE) -------------------- */
router.post(
  "/update-profile",
  auth, // 🔥 PROTECT ROUTE
  upload.single("avatar"),
  validate(updateProfileSchema), // ✅ Add validation
  async (req, res) => {
    try {
      const userId = req.user.id; // 🔥 FROM JWT
      const { username } = req.body;

      // ✅ Input already validated by middleware
      const updates = {};
      if (username) updates.username = username.trim();


      /* ---------- AVATAR UPLOAD ---------- */
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "chat-app/avatars",
              transformation: [
                { width: 256, height: 256, crop: "fill" },
              ],
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          stream.end(req.file.buffer);
        });

        updates.avatar = uploadResult.secure_url;
      }

      /* ---------- UPDATE USER ---------- */
      const user = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true }
      ).select("_id username email avatar");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (err) {
      console.error("❌ update-profile error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   get:
 *     summary: Get detailed user profile
 *     description: Retrieve comprehensive user profile with statistics
 *     tags:
 *       - Users
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
 *         description: User profile found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 isOnline:
 *                   type: boolean
 *                 lastSeen:
 *                   type: string
 *                   format: date-time
 *                 messageCount:
 *                   type: integer
 *                 chatCount:
 *                   type: integer
 *                 friendCount:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Get user with additional profile information
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get additional stats
    const Message = require("../models/Message");
    const Chat = require("../models/Chat");

    // Get accurate message count for this user
    const messageCount = await Message.countDocuments({
      sender: userId,
      deleted: { $ne: true } // Don't count deleted messages
    });

    // Get accurate chat count for this user
    const chatCount = await Chat.countDocuments({
      participants: userId
    });

    // Determine if user is truly online (active within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isRecentlyActive = user.lastActivity && user.lastActivity > fiveMinutesAgo;
    const actuallyOnline = user.isOnline && isRecentlyActive;

    // Enhance user object with accurate stats
    const userProfile = {
      ...user.toObject(),
      messageCount,
      chatCount,
      friendCount: chatCount, // Use chat count as friend count for now
      isOnline: actuallyOnline,
      // Format last seen properly
      lastSeen: actuallyOnline ? new Date() : user.lastSeen,
    };

    console.log(`📊 Profile for ${user.username}: ${messageCount} messages, ${chatCount} chats, online: ${actuallyOnline}`);
    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
