// chat-server/routes/chat.js
const router = require("express").Router();
const mongoose = require("mongoose");
const Chat = require("../models/Chat");

/* -------------------- CREATE CHAT -------------------- */
router.post("/create", async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;

    // 🔒 Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(otherUserId)
    ) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    // ✅ Keep participants sorted to avoid duplicate chats
    const participants = [userId, otherUserId].map(String).sort();

    let chat = await Chat.findOne({ participants });

    // ➕ Create if not exists
    if (!chat) {
      chat = await Chat.create({ participants });
    }

    // 🔥 IMPORTANT: populate before returning
    const populatedChat = await Chat.findById(chat._id).populate(
      "participants",
      "_id username avatar email"
    );

    return res.json(populatedChat);
  } catch (err) {
    console.error("[chat-create] error:", err);
    return res.status(500).json({ message: "Failed to create chat" });
  }
});

/* -------------------- GET MY CHATS -------------------- */
router.get("/my/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 🔒 Validate ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

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
