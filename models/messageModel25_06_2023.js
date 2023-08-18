
const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "userLogin" },
    content: { type: String},
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "userLogin" }],
    file: {
      filename: { type: String},
      fileURL: { type: String },
    },
  },
  { timestamps: true }
);

messageSchema.methods.generateFileURL = function () {
  const fileURL = `http://localhost:3000/uploads/Images/${this.file.filename}`;
  this.file.fileURL = fileURL;
};

messageSchema.pre('save', function (next) {
  if (this.file) {
    this.generateFileURL();
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
