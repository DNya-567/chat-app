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

module.exports = router;
