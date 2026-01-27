require("dotenv").config();

/* -------------------- ENV CHECK -------------------- */
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing – add it to your .env file");
  process.exit(1);
}

/* -------------------- DEPENDENCIES -------------------- */
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

/* -------------------- LOCAL MODULES -------------------- */
const connectDB = require("./db");
const Message = require("./models/Message");
const Chat = require("./models/Chat");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/users");

/* -------------------- EXPRESS APP -------------------- */
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://chat-rczw6ptpg-dnya-567s-projects.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------------------- API ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);

/* -------------------- DATABASE -------------------- */
connectDB();

/* -------------------- HTTP SERVER -------------------- */
const server = http.createServer(app);

/* -------------------- SOCKET.IO -------------------- */
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-rczw6ptpg-dnya-567s-projects.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST"],
  },
});


/* ==================== SOCKET LOGIC ==================== */
io.on("connection", (socket) => {
  console.log("\n[SOCKET] 🔌 Connected:", socket.id);

  /* ---------- JOIN USER ROOMS ---------- */
  socket.on("join_user_chats", async ({ userId }) => {
    console.log("[SOCKET] join_user_chats →", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) return;

    socket.join(userId.toString());

    const chats = await Chat.find({ participants: userId }).select("_id");
    chats.forEach((c) => socket.join(c._id.toString()));
  });

  /* ---------- JOIN SINGLE CHAT ---------- */
  socket.on("join_chat", ({ chatId }) => {
    console.log("[SOCKET] join_chat →", chatId);
    socket.join(chatId.toString());
  });

  /* ---------- LOAD MESSAGES ---------- */
  socket.on("load_messages", async ({ chatId }) => {
    console.log("[SOCKET] load_messages →", chatId);

    const msgs = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "_id username");

    socket.emit("chat_messages", msgs);
  });

  /* ---------- SEND MESSAGE ---------- */
  socket.on("send_message", async ({ chatId, senderId, text }) => {
    console.log("[SOCKET] send_message:", { chatId, senderId, text });

    const message = await Message.create({
      chatId,
      sender: senderId,
      text,
    });

    const populated = await Message.findById(message._id).populate(
      "sender",
      "_id username"
    );

    io.to(chatId.toString()).emit("receive_message", populated);
  });

  /* ---------- 🔥 EMOJI REACTION ---------- */
  socket.on("react_message", async ({ messageId, emoji, userId }) => {
    console.log("➡️ react_message received", { messageId, emoji, userId });

    const message = await Message.findById(messageId);
    console.log("📄 BEFORE SAVE:", message);

    if (!message) {
      console.log("❌ Message not found");
      return;
    }

    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId
    );

    message.reactions.push({ emoji, userId });

    await message.save();

    const verify = await Message.findById(messageId);
    console.log("✅ AFTER SAVE:", verify.reactions);

    const updated = await Message.findById(messageId).populate(
      "sender",
      "_id username"
    );

    io.to(message.chatId.toString()).emit("message_updated", updated);
  });

  /* ---------- 🔥 DELETE MESSAGE ---------- */
  socket.on("delete_message", async ({ messageId, userId }) => {
    console.log("🗑️ delete_message", { messageId, userId });

    const message = await Message.findById(messageId);
    if (!message) return;

    if (message.sender.toString() !== userId) return;

    message.deleted = true;
    message.text = "This message was deleted";
    message.reactions = [];

    await message.save();

    const updated = await Message.findById(messageId).populate(
      "sender",
      "_id username"
    );

    io.to(message.chatId.toString()).emit("message_updated", updated);
  });

  socket.on("disconnect", () => {
    console.log("[SOCKET] ❌ Disconnected:", socket.id);
  });
});


/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[server] 🚀 Server listening on http://localhost:${PORT}`);
});
