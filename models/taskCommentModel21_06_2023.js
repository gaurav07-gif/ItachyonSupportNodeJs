const mongoose = require("mongoose");

const taskCommentSchema = new mongoose.Schema(
  {
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: "UserLogin" },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: "tasks" },
        text: { type: String },
        parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "taskComments" },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserLogin" },
  },
  {
    timestamps: true,
  }
  );
  

  const TaskComment = mongoose.model("TaskComment", taskCommentSchema);

module.exports = TaskComment;