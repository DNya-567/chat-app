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

    reactions: {
      type: [reactionSchema],
      default: [],
    },

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true,
    minimize: false
  }
  
);
console.log("🔥 MESSAGE SCHEMA PATHS:", Object.keys(messageSchema.paths));

module.exports = mongoose.model("Message", messageSchema);
