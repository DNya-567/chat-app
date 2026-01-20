const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const upload = require("../middleware/upload"); // multer (memory storage)
const auth = require("../middleware/auth"); // 🔐 JWT middleware

const router = express.Router();

/* -------------------- CLOUDINARY CONFIG -------------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* -------------------- GET USER BY ID -------------------- */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const user = await User.findById(id).select(
    "_id username email avatar"
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

/* -------------------- UPDATE PROFILE (SECURE) -------------------- */
router.post(
  "/update-profile",
  auth, // 🔥 PROTECT ROUTE
  upload.single("avatar"),
  async (req, res) => {
    try {
      const userId = req.user.id; // 🔥 FROM JWT
      const { username } = req.body;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

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
