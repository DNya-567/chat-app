// server/server.js
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

app.use(cors());
app.use(express.json()); // JSON only (multer handles multipart)

/* ✅ IMPORTANT: serve uploaded avatars */
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
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

/* -------------------- SOCKET LOGIC -------------------- */
io.on("connection", (socket) => {
  console.log("[server] ✅ Socket connected:", socket.id);

  socket.on("join_user_chats", async ({ userId }) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn("[server] ⚠️ invalid userId:", userId);
      return;
    }

    const chats = await Chat.find({ participants: userId }).select("_id");
    chats.forEach((c) => socket.join(String(c._id)));
  });

  socket.on("join_chat", ({ chatId }) => {
    socket.join(String(chatId));
  });

  socket.on("load_messages", async ({ chatId }) => {
    const msgs = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "username _id");

    socket.emit("chat_messages", msgs);
  });

  socket.on("send_message", async ({ chatId, senderId, text }) => {
    if (!chatId || !senderId || !text?.trim()) return;

    const message = await Message.create({
      chatId,
      sender: senderId,
      text: text.trim(),
    });

    io.to(String(chatId)).emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    console.log("[server] ❌ Socket disconnected:", socket.id);
  });
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[server] 🚀 Server listening on http://localhost:${PORT}`);
});
