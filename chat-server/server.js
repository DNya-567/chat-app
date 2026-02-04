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
const User = require("./models/User");

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
    socket.userId = userId; // Store userId on socket for disconnect handling

    // Update user online status
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActivity: new Date(),
        lastSeen: new Date(),
      });
      console.log(`📱 User ${userId} is now online`);
    } catch (error) {
      console.error("Error updating user online status:", error);
    }

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

      // Update sender's last activity
      try {
        await User.findByIdAndUpdate(senderId, {
          lastActivity: new Date(),
          isOnline: true,
        });
      } catch (error) {
        console.warn("Could not update user activity:", error);
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

      // ...existing code...

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

      // Also broadcast the chat itself so it appears in chat list without refresh
      try {
        const chat = await Chat.findById(chatId)
          .populate("participants", "_id username avatar")
          .sort({ updatedAt: -1 });

        if (chat) {
          // Broadcast new_chat to all participants so they see it in their chat list
          // Also broadcast receive_message to participant personal rooms for notifications
          chat.participants.forEach((participant) => {
            io.to(participant._id.toString()).emit("new_chat", chat);
            // Send message to participant's personal room for notification trigger
            io.to(participant._id.toString()).emit("new_message_notification", {
              message: populated,
              chat: chat,
            });
          });
          console.log("📢 Broadcast chat and notification to participants");
        }
      } catch (err) {
        console.warn("⚠️ Could not broadcast chat update:", err.message);
      }
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

  /* ---------- 📌 PIN MESSAGE ---------- */
  socket.on("pin_message", async ({ messageId, userId, chatId }) => {
    console.log("📌 pin_message", { messageId, userId, chatId });

    try {
      if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(chatId)) {
        console.log("❌ pin_message: invalid ids");
        return socket.emit("error_message", { message: "Invalid IDs" });
      }

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit("error_message", { message: "Message not found" });
      }

      // Toggle pin status
      message.pinned = !message.pinned;
      message.pinnedBy = message.pinned ? userId : null;
      message.pinnedAt = message.pinned ? new Date() : null;

      await message.save();

      // Update Chat's pinnedMessages array
      const chat = await Chat.findById(chatId);
      if (chat) {
        if (message.pinned) {
          // Add to pinned messages if not already there
          if (!chat.pinnedMessages.includes(messageId)) {
            chat.pinnedMessages.push(messageId);
          }
        } else {
          // Remove from pinned messages
          chat.pinnedMessages = chat.pinnedMessages.filter(
            (id) => id.toString() !== messageId.toString()
          );
        }
        await chat.save();
      }

      const updated = await Message.findById(messageId)
        .populate("sender", "_id username")
        .populate("pinnedBy", "_id username")
        .populate({ path: "replyTo", populate: { path: "sender", select: "_id username" } });

      // Broadcast to all users in chat
      io.to(chatId.toString()).emit("message_updated", updated);
      io.to(chatId.toString()).emit("chat_pins_updated", {
        chatId,
        pinnedMessages: chat.pinnedMessages,
      });

      console.log(`📌 Message ${message.pinned ? 'pinned' : 'unpinned'} successfully`);
    } catch (err) {
      console.error("❌ pin_message error:", err);
      socket.emit("error_message", { message: "Failed to pin message" });
    }
  });

  /* ---------- ✏️ EDIT MESSAGE ---------- */
  socket.on("edit_message", async ({ messageId, userId, newText }) => {
    console.log("✏️ edit_message", { messageId, userId, newText });

    try {
      if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) {
        console.log("❌ edit_message: invalid ids");
        return socket.emit("error_message", { message: "Invalid IDs" });
      }

      if (!newText || newText.trim() === "") {
        return socket.emit("error_message", { message: "Message text cannot be empty" });
      }

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit("error_message", { message: "Message not found" });
      }

      // Only sender can edit their own message
      if (message.sender.toString() !== userId) {
        return socket.emit("error_message", { message: "You can only edit your own messages" });
      }

      // Cannot edit deleted messages
      if (message.deleted) {
        return socket.emit("error_message", { message: "Cannot edit deleted messages" });
      }

      // Save old text to edit history
      message.editHistory.push({
        text: message.text,
        editedAt: new Date(),
      });

      // Update message text
      message.text = newText.trim();
      message.edited = true;

      await message.save();

      const updated = await Message.findById(messageId)
        .populate("sender", "_id username")
        .populate("pinnedBy", "_id username")
        .populate({ path: "replyTo", populate: { path: "sender", select: "_id username" } });

      // Broadcast to all users in chat
      io.to(message.chatId.toString()).emit("message_updated", updated);

      console.log("✏️ Message edited successfully");
    } catch (err) {
      console.error("❌ edit_message error:", err);
      socket.emit("error_message", { message: "Failed to edit message" });
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

      // Update user activity
      try {
        await User.findByIdAndUpdate(userId, {
          lastActivity: new Date(),
          isOnline: true,
        });
      } catch (error) {
        console.warn("Could not update user activity:", error);
      }

      const message = await Message.findById(messageId);
      if (!message) {
        console.log("❌ react_message: message not found");
        return;
      }

      // ...existing code...

      // Don't mark own messages as read
      if (message.sender.toString() === userId) {
        console.log("❌ mark_message_as_read: cannot read own message");
        return;
      }

      // Check if user has already read this message
      const alreadyRead = message.readReceipts.some(
        (receipt) => receipt.userId.toString() === userId
      );

      if (!alreadyRead) {
        message.readReceipts.push({ userId, readAt: new Date() });
        await message.save();
      }

      const updated = await Message.findById(messageId)
        .populate("sender", "_id username")
        .populate("readReceipts.userId", "_id username")
        .populate({ path: "replyTo", populate: { path: "sender", select: "_id username" } });

      // Broadcast updated message to chat room
      io.to(message.chatId.toString()).emit("message_updated", updated);
    } catch (err) {
      console.error("❌ mark_message_as_read error:", err);
      socket.emit("error_message", { message: "Failed to mark message as read" });
    }
  });

  /* ---------- 📬 MARK CHAT AS READ ---------- */
  socket.on("mark_chat_as_read", async ({ chatId, userId }) => {
    console.log("📬 mark_chat_as_read", { chatId, userId });

    try {
      if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
        console.log("❌ mark_chat_as_read: invalid ids");
        return;
      }

      // Mark all messages in the chat as read by this user
      const messages = await Message.find({ chatId });

      for (const message of messages) {
        // Don't mark own messages
        if (message.sender.toString() === userId) continue;

        // Check if already read
        const alreadyRead = message.readReceipts.some(
          (receipt) => receipt.userId.toString() === userId
        );

        if (!alreadyRead) {
          message.readReceipts.push({ userId, readAt: new Date() });
          await message.save();
        }
      }

      // Emit read_receipts_updated for the entire chat
      const updatedMessages = await Message.find({ chatId })
        .populate("sender", "_id username")
        .populate("readReceipts.userId", "_id username");

      io.to(chatId.toString()).emit("chat_read_receipts_updated", {
        chatId,
        userId,
        messages: updatedMessages,
      });
    } catch (err) {
      console.error("❌ mark_chat_as_read error:", err);
    }
  });

  socket.on("disconnect", async () => {
    console.log("[SOCKET] ❌ Disconnected:", socket.id);

    // Update user offline status if userId was stored on socket
    if (socket.userId) {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
          lastActivity: new Date(),
        });
        console.log(`📱 User ${socket.userId} is now offline`);
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }
    }
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

