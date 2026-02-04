const mongoose = require("mongoose");
console.log("🔥 MESSAGE MODEL LOADED FROM:", __filename);

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);

const readReceiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    // Reply reference to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    reactions: {
      type: [reactionSchema],
      default: [],
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    readReceipts: {
      type: [readReceiptSchema],
      default: [],
    },

    pinned: {
      type: Boolean,
      default: false,
    },

    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    pinnedAt: {
      type: Date,
      default: null,
    },

    edited: {
      type: Boolean,
      default: false,
    },

    editHistory: [
      {
        text: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true,
    minimize: false
  }
  
);
console.log("🔥 MESSAGE SCHEMA PATHS:", Object.keys(messageSchema.paths));

module.exports = mongoose.model("Message", messageSchema);
