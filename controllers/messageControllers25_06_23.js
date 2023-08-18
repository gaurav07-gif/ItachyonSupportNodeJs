
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//...................................
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.body.chatId) {
      return cb(new Error("chatId is required"));
    }
    const destinationDir = "uploads/Images";
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    cb(null, destinationDir);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + "_" + Date.now() + extension;
    cb(null, filename);
  },
});
// Multer upload instance
const upload = multer({ storage });

const allMessages = async (req, res) => {
  try {
    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .skip(skip)
      .sort({createdAt: -1 })
      .limit(Number(limit));

    res.json({
      status: 200,
      message: "success",
      data: messages,
    });
  } catch (error) {
    res.status(400).json({ error: "error" });
  }
};

const sendMessage = asyncHandler(async (req, res) => {
   upload.single("file")(req, res, async (err) => { 
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error uploading file" });
    }
    const { file, content, chatId } = req.body;

    if ( !chatId) {
      console.log("Invalid data passed into request");
     return res.sendStatus(400);
   }

    // If both file and content are provided............
    if (req.file && content) {
      const { filename, path: filePath } = req.file || {};
      const { readBy } = req.body;
      const fileSize = req.file.size;
      const fileExtension = path.extname(filename);
      const fileName = path.basename(filename, fileExtension);
      // const serverFilePath = req.file.path;
      // Check if the file extension is valid
      const supportedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".gif", ".txt", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt"];
      if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
        return res.status(400).json({ error: "Invalid file format. Only  jpg,jpeg,png,pdf,gif,txt,xlsx,xls,docx,doc,pptx,ppt files are supported." });
      }
      const newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
        file: {
          filename: filename || fileName,
          fileURL: "",
        },
        readBy: readBy || [],
      };
      try {
        let message = await Message.create(newMessage);
        const fileURL = `${req.protocol}://${req.get("host")}/uploads/Images/${message.file.filename}`;
        message.file.fileURL = fileURL;
        message = await User.populate(message, {
          path: "chat.users",
          select: "name pic email",
        });
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
        return res.status(200).json(message);
      } catch (error) {
        return res.status(400).json({ error: "Failed to send message with file and content" });
      }
    }
    

    // // If only file is provided
    else if (req.file && chatId) {
      const { filename, path: filePath } = req.file || {};
      const { readBy } = req.body;
      const fileSize = req.file.size;
      const fileExtension = path.extname(filename);
      const fileName = path.basename(filename, fileExtension);
      
      // Check if the file extension is valid
      const supportedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".gif", ".txt", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt"];
      if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
        return res.status(400).json({ error: "Invalid file format. Only  jpg,jpeg,png,pdf,gif,txt,xlsx,xls,docx,doc,pptx,ppt files are supported." });
      }
      const newMessage = {
        sender: req.user._id,
        chat: chatId,
        file: {
          filename: filename || fileName,
          fileURL: "",
        },
        readBy: readBy || [],
      };

      try {
        let message = await Message.create(newMessage);
        const fileURL = `${req.protocol}://${req.get("host")}/uploads/Images/${message.file.filename}`;
        message.file.fileURL = fileURL;
        message = await User.populate(message, {
          path: "chat.users",
          select: "name pic email",
        });
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
        return res.status(200).json(message);
      } catch (error) {
        return res.status(400).json({ error: "Failed to send message with file" });
      }
    }
    // If only content is provided
    else if (content && chatId) {
      try {
        const newMessage = {
          sender: req.user._id,
          content: content,
          chat: chatId,
        };
    
        const message = await Message.create(newMessage);
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
    
        // Remove the file-related information from the message object in MongoDB
        await Message.updateOne({ _id: message._id }, { $unset: { file: 1 } });
    
        return res.status(200).json({ status: "message sent successfully" });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while sending the message" });
      }
    }
    
    // If neither file nor content is provided
    else {
      return res.status(400).json({ error: "Either file or content is required" });
    }
  });
  
});



module.exports = { allMessages, sendMessage };