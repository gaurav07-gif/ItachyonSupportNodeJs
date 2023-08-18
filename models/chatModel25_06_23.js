const mongoose = require("mongoose");

const chatModel = mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    isGroupChat: { type: Boolean, default: false },

    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "userLogin" },

    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "userLogin" }],
    messageDelivered: {
      type: "boolean",
    },
    count: {
      type: "string",
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatModel);

module.exports = Chat;
