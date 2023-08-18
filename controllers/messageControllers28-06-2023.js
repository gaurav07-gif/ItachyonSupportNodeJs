
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const admin = require("firebase-admin");
//CONNECTION WITH FIREBASE
const serviceAccount = require("../config/serviceAccountKey.json");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://itachyon-support-ac993.firebaseio.com",
  });
}

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

    const { file, content, chatId, markAsRead } = req.body;

    if (!chatId) {
      console.log("Invalid data passed into request");
      return res.sendStatus(400);
    }

    // If both file and content are provided
    if (req.file && content) {
      const { filename, path: filePath } = req.file || {};
      const { readBy } = req.body;
      const fileSize = req.file.size;
      const fileExtension = path.extname(filename);
      const fileName = path.basename(filename, fileExtension);

      // Check if the file extension is valid
      const supportedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf",
        ".gif",
        ".txt",
        ".xlsx",
        ".xls",
        ".docx",
        ".doc",
        ".pptx",
        ".ppt",
      ];
      if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
        return res.status(400).json({
          error:
            "Invalid file format. Only  jpg,jpeg,png,pdf,gif,txt,xlsx,xls,docx,doc,pptx,ppt files are supported.",
        });
      }

      const newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
        file: {
          filename: filename || fileName,
          fileURL: "",
        },
        readBy: markAsRead ? [req.user._id] : [],
      };

      try {
        let message = await Message.create(newMessage);
        const fileURL = `${req.protocol}://${req.get("host")}/uploads/Images/${
          message.file.filename
        }`;
        message.file.fileURL = fileURL;

        message = await User.populate(message, {
          path: "chat.users",
          select: "name pic email",
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

        // Update the unreadCounts for each user in the chat
        await Chat.findByIdAndUpdate(
          chatId,
          {
            $inc: { "unreadCounts.$[elem].count": 1 },
          },
          {
            arrayFilters: [{ "elem.user": { $ne: req.user._id } }],
          }
        );

        // Send FCM notification to users in the chat
        const chat = await Chat.findById(chatId).populate(
          "users",
          "deviceTokens"
        );
      	const fcmTokens = chat.users
          .filter((user) => user.deviceTokens && user.deviceTokens.length > 0) // Filter out users without deviceTokens
         .flatMap((user) => user.deviceTokens);
        if (fcmTokens.length > 0) {
          const payload = {
            notification: {
              title: "New Message",
              body: content,
            },
          };

          try {
            const response = await admin.messaging().sendMulticast({
              tokens: fcmTokens,
              notification: payload.notification,
            });

            console.log("FCM response:", response);
          } catch (error) {
            console.error("Failed to send FCM notification:", error);
          }
        }

        return res.status(200).json(message);
      } catch (error) {
        return res
          .status(400)
          .json({ error: "Failed to send message with file and content" });
      }
    }

    // If only file is provided
    else if (req.file && chatId) {
      const { filename, path: filePath } = req.file || {};
      const { readBy } = req.body;
      const fileSize = req.file.size;
      const fileExtension = path.extname(filename);
      const fileName = path.basename(filename, fileExtension);

      // Check if the file extension is valid
      const supportedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf",
        ".gif",
        ".txt",
        ".xlsx",
        ".xls",
        ".docx",
        ".doc",
        ".pptx",
        ".ppt",
      ];
      if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
        return res.status(400).json({
          error:
            "Invalid file format. Only  jpg,jpeg,png,pdf,gif,txt,xlsx,xls,docx,doc,pptx,ppt files are supported.",
        });
      }

      const newMessage = {
        sender: req.user._id,
        chat: chatId,
        file: {
          filename: filename || fileName,
          fileURL: "",
        },
        readBy: markAsRead ? [req.user._id] : [],
      };

      try {
        let message = await Message.create(newMessage);
        const fileURL = `${req.protocol}://${req.get("host")}/uploads/Images/${
          message.file.filename
        }`;
        message.file.fileURL = fileURL;

        message = await User.populate(message, {
          path: "chat.users",
          select: "name pic email",
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

        // Update the unreadCounts for each user in the chat
        await Chat.findByIdAndUpdate(
          chatId,
          {
            $inc: { "unreadCounts.$[elem].count": 1 },
          },
          {
            arrayFilters: [{ "elem.user": { $ne: req.user._id } }],
          }
        );

        // Send FCM notification to users in the chat
        const chat = await Chat.findById(chatId).populate(
          "users",
          "deviceTokens"
        );
        const fcmTokens = chat.users
          .filter((user) => user.deviceTokens && user.deviceTokens.length > 0) // Filter out users without deviceTokens
          .flatMap((user) => user.deviceTokens);

        if (fcmTokens.length > 0) {
          const payload = {
            notification: {
              title: req.user.email,
              body: "A new message with file has been sent.",
            },
          };

          try {
            const response = await admin.messaging().sendMulticast({
              tokens: fcmTokens,
              notification: payload.notification,
            });

            console.log("FCM response:", response);
          } catch (error) {
            console.error("Failed to send FCM notification:", error);
          }
        }

        return res.status(200).json(message);
      } catch (error) {
        return res
          .status(400)
          .json({ error: "Failed to send message with file" });
      }
    }

    // If only content is provided
    else if (content && chatId) {
      try {
        const newMessage = {
          sender: req.user._id,
          content: content,
          chat: chatId,
          readBy: markAsRead ? [req.user._id] : [],
        };

        const message = await Message.create(newMessage);

        await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
        // Remove the file-related information from the message object in MongoDB
        await Message.updateOne({ _id: message._id }, { $unset: { file: 1 } });
        // Update the unreadCounts for each user in the chat
        await Chat.findByIdAndUpdate(
          chatId,
          {
            $inc: { "unreadCounts.$[elem].count": 1 },
          },
          {
            arrayFilters: [{ "elem.user": { $ne: req.user._id } }],
          }
        );

        // Send FCM notification to users in the chat
        const chat = await Chat.findById(chatId).populate(
          "users",
          "deviceTokens"
        );
        const fcmTokens = chat.users
          .filter((user) => user.deviceTokens && user.deviceTokens.length > 0) // Filter out users without deviceTokens
          .flatMap((user) => user.deviceTokens);

        if (fcmTokens.length > 0) {
          const payload = {
            notification: {
              title: req.user.email,
              body: content,
            },
          };

          try {
            const response = await admin.messaging().sendMulticast({
              tokens: fcmTokens,
              notification: payload.notification,
            });

            console.log("FCM response:", response);
          } catch (error) {
            console.error("Failed to send FCM notification:", error);
          }
        }

        return res.status(200).json(message);
      } catch (error) {
        return res
          .status(400)
          .json({ error: "Failed to send message with content" });
      }
    }

    // If neither file nor content is provided
    else {
      console.log("Invalid data passed into request");
      return res.sendStatus(400);
    }
  });
});



// READ MESSAGES
const markMessageAsRead = async (req, res) => {
  const { messageId } = req.params;
  const { markAsRead } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId).populate("chat");
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const chatId = message.chat;

    // Check if the user is part of the chat
    const chat = await Chat.findOne({ _id: chatId, users: userId });
    if (!chat) {
      return res
        .status(403)
        .json({ error: "You are not authorized to mark this message" });
    }

    if (markAsRead === "true") {
      // Add user to readBy array
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        await message.save();
      }

      // Decrement the count for the user in the chat model
      const userUnreadCount = chat.unreadCounts.find((item) => {
        console.log("item:", item);
        console.log("item.user:", item.user);
        console.log("userId:", userId);
        console.log("item.user.toString():", item.user.toString());
        console.log("userId.toString():", userId.toString());
        return item.user.toString() === userId.toString();
      });
      console.log("userUnreadCount:", userUnreadCount);

      if (userUnreadCount) {
        userUnreadCount.count--;
        await chat.save();
      }

      return res.status(200).json({ message: "Message marked as read" });
    } else if (markAsRead === "false") {
      // Remove user from readBy array
      if (message.readBy.includes(userId)) {
        message.readBy = message.readBy.filter(
          (user) => user.toString() !== userId.toString()
        );
        await message.save();
      }

      // Increment the count for the user in the chat model
      const userUnreadCount = chat.unreadCounts.find((item) => {
        console.log("item:", item);
        console.log("item.user:", item.user);
        console.log("userId:", userId);
        console.log("item.user.toString():", item.user.toString());
        console.log("userId.toString():", userId.toString());
        return item.user.toString() === userId.toString();
      });
      console.log("userUnreadCount:", userUnreadCount);

      if (userUnreadCount) {
        userUnreadCount.count++;
        await chat.save();
      }

      return res.status(200).json({ message: "Message marked as unread" });
    } else {
      return res.status(400).json({ error: "Invalid markAsRead value" });
    }
  } catch (error) {
    console.log(error); // Log the error for further investigation
    return res.status(400).json({ error: "Failed to mark message" });
  }
};



module.exports = { allMessages, sendMessage, markMessageAsRead };