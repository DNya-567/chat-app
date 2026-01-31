const router = require("express").Router();
const mongoose = require("mongoose");
const Message = require("../models/Message");

/* -------------------- GET MESSAGES FOR A CHAT -------------------- */
router.get("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    const msgs = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "_id username");

    return res.json(msgs);
  } catch (err) {
    console.error("[messages-get] error:", err);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
});

module.exports = router;
