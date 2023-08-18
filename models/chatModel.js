const mongoose = require("mongoose");

const chatModel = mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    clinicId:{type: mongoose.Schema.Types.ObjectId, ref: "clinic"},
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
    unreadCounts: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "  " },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatModel);

module.exports = Chat;
