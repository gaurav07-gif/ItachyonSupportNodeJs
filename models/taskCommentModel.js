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
    cfile: {
      filename: { type: String},
      fileURL: { type: String },
     },
  },
  {
    timestamps: true,
  }
  );

  //comment file
  taskCommentSchema.methods.generateCommentFileURL = function () {
  if (this.comments && this.comments.length > 0) {
    this.comments.forEach((comment) => {
      if (comment.cfile && comment.cfile.filename) {
        const fileURL = `http://support.itachyon.com/uploads/Task/Comments/${comment.cfile.filename}`;
        comment.cfile.fileURL = fileURL;
      }
    });
    taskSchema.pre("save", function (next) {
      if (this.comments) {
        this.generateCommentFileURL();
      }
      next();
    });

  }
};
  

  const TaskComment = mongoose.model("TaskComment", taskCommentSchema);

module.exports = TaskComment;