const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      title: "One to One Chat",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json({ status: "ok" });
    } catch (error) {
      res.status(400).json({ error: "error" });
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  try {
    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("authorId", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400).json({ error });
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.title) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }
  console.log(req.body.users);
  const users = req.body.users;
  // const users1 = JSON.parse(req.body.users);
  console.log(users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("Minimum 2 users are required to form a group chat");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      title: req.body.title,
      description: req.body.description,
      isGroupChat: true,
      users: users,
      authorId: req.user,
      count: "0",
    });
    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("authorId", "-password");

    // Add group chat to each user's chats
    // const userIds = users.map((user) => user._id);
    // await User.updateMany(
    //   { _id: { $in: userIds } },
    //   { $push: { chats: groupChat._id } }
    // );

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
//getGroupChat--------------------------------------------------------------------------------------------
const getGroupChat = asyncHandler(async (req, res) => {
  try {
    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    Chat.find({
      isGroupChat: true,
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("authorId", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
        });
        res.json({
          message: "Success",
          data: results,
        });
      });
  } catch (error) {
    res.status(400).json({ error: "error" });
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, title } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      title: title,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("authorId", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("authorId", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("authorId", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});
//http://localhost:3000/api/chat/searchMemberInGrp?searchUser=:id
const searchMemberInGrp = asyncHandler(async (req, res) => {
  try {
    // Retrieve searchUser parameter from query parameters
    const searchUser = req.query.searchUser;

    Chat.find({
      isGroupChat: true,
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("authorId", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        if (searchUser) {
          // Check if the searchUser exists in the group
          const userExists = results.some((chat) =>
            chat.users.some((user) => user._id.equals(searchUser))
          );
          if (userExists) {
            // Retrieve user data
            const user = await User.findById(searchUser);
            res.json({
              message: "Success",
              data: user,
            });
          } else {
            res.json({
              message: "User not in group",
            });
          }
        } else {
          results = await User.populate(results, {
            path: "latestMessage.sender",
          });
          res.json({
            message: "Success",
            data: results,
          });
        }
      });
  } catch (error) {
    res.status(400).json({ error: "Error" });
  }
});


module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  getGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  searchMemberInGrp,
};
