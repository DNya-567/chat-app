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
const swaggerUi = require("swagger-ui-express");

/* -------------------- LOCAL MODULES -------------------- */
const connectDB = require("./db");
const swaggerSpecs = require("./config/swagger");
const Message = require("./models/Message");
const Chat = require("./models/Chat");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/users");
const messagesRoutes = require("./routes/messages");


/* -------------------- EXPRESS APP -------------------- */
const app = express();

// Allow multiple origins for development and production
const allowedOrigins = [
  "http://localhost:5173",      // Vite default dev port
  "http://localhost:5174",      // Alternative dev port
  "http://localhost:3000",      // Alternative dev port
  "http://localhost:3001",      // Alternative dev port
  "http://127.0.0.1:5173",      // Localhost alias
  "http://127.0.0.1:5174",      // Localhost alias
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (postman, server-to-server) with no origin
    if (!origin) return callback(null, true);

    // Allow all localhost origins (any port) and loopback
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }

    // Allow configured short list and known deploy hosts
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".onrender.com")
    ) {
      return callback(null, true);
    }

    console.error("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------------------- SWAGGER UI -------------------- */
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerSpecs, { explorer: true }));

/* -------------------- API ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messagesRoutes);



/* -------------------- DATABASE -------------------- */
connectDB();

/* -------------------- HTTP SERVER -------------------- */
const server = http.createServer(app);

/* -------------------- SOCKET.IO -------------------- */
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
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

    // Previously we auto-joined every chat room for the user here which caused each socket
    // to receive messages for all chats. Instead, only join the user's personal room and
    // rely on the client to call `join_chat` for the specific chat it opens.
    //
    // const chats = await Chat.find({ participants: userId }).select("_id");
    // chats.forEach((c) => socket.join(c._id.toString()));
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
      .populate("sender", "_id username")
      .populate({ path: "replyTo", populate: { path: "sender", select: "_id username" } });

    socket.emit("chat_messages", { messages: msgs, chatId });
  });

  /* ---------- SEND MESSAGE ---------- */
  socket.on("send_message", async ({ chatId, senderId, text, replyTo }) => {
    console.log("[SOCKET] send_message:", { chatId, senderId, text, replyTo });

    try {
      // Validate chatId and senderId
      if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        console.log("❌ send_message: invalid chatId or senderId");
        return;
      }

      // Validate replyTo if provided
      let validReplyTo = null;
      if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
        validReplyTo = replyTo;
      }

      const message = await Message.create({
        chatId,
        sender: senderId,
        text,
        replyTo: validReplyTo,
      });

      const populated = await Message.findById(message._id)
        .populate("sender", "_id username")
        .populate({ path: "replyTo", populate: { path: "sender", select: "_id username" } });

      // If sender hasn't joined the room yet, emit directly to their socket to ensure they see the message
      try {
        if (!socket.rooms.has(chatId.toString())) {
          socket.emit("receive_message", populated);
        }
      } catch (e) {
        // socket.rooms may not be available in some contexts, ignore
      }

      // Broadcast to room (will include sender if they are in the room)
      io.to(chatId.toString()).emit("receive_message", populated);
    } catch (err) {
      console.error("❌ send_message error:", err);
      socket.emit("error_message", { message: "Failed to send message" });
    }
  });

  /* ---------- 🔥 EMOJI REACTION ---------- */
  socket.on("react_message", async ({ messageId, emoji, userId }) => {
    console.log("➡️ react_message received", { messageId, emoji, userId });

    try {
      if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) {
        console.log("❌ react_message: invalid ids");
        return;
      }

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

      const updated = await Message.findById(messageId)
        .populate("sender", "_id username")
        .populate({ path: "replyTo", populate: { path: "sender", select: "_id username" } });

      io.to(message.chatId.toString()).emit("message_updated", updated);
    } catch (err) {
      console.error("❌ react_message error:", err);
      socket.emit("error_message", { message: "Failed to react to message" });
    }
  });

  /* ---------- 🔥 DELETE MESSAGE ---------- */
  socket.on("delete_message", async ({ messageId, userId }) => {
    console.log("🗑️ delete_message", { messageId, userId });

    try {
      if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) {
        console.log("❌ delete_message: invalid ids");
        return;
      }

      const message = await Message.findById(messageId);
      if (!message) return;

      if (message.sender.toString() !== userId) return;

      message.deleted = true;
      message.text = "This message was deleted";
      message.reactions = [];

      await message.save();

      const updated = await Message.findById(messageId)
        .populate("sender", "_id username")
        .populate({ path: "replyTo", populate: { path: "sender", select: "_id username" } });

      io.to(message.chatId.toString()).emit("message_updated", updated);
    } catch (err) {
      console.error("❌ delete_message error:", err);
      socket.emit("error_message", { message: "Failed to delete message" });
    }
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

// Handle port already in use error
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`\n🔧 Solutions:\n`);
    console.error(`1. Kill the process using port ${PORT}:`);
    console.error(`   PowerShell (Admin):`);
    console.error(`   netstat -ano | findstr :${PORT}`);
    console.error(`   taskkill /PID <pid> /F\n`);
    console.error(`2. Or use a different port:`);
    console.error(`   set PORT=5001 && npm run dev\n`);
    console.error(`3. Or restart your computer\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

