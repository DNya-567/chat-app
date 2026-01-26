const router = require("express").Router();
const mongoose = require("mongoose");
const Chat = require("../models/Chat");

/* -------------------- CREATE CHAT -------------------- */
router.post("/create", async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(otherUserId)
    ) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    if (userId === otherUserId) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

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

/* -------------------- GET MY CHATS -------------------- */
router.get("/my/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

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
