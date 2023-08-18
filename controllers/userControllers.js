const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

//GET REQUEST TO FETCH ALL THE USERS OF THE DATABASE
const getData = async (req, res, next) => {
  try {
    const { page = 1 } = req.body;
    limit = 0;
    const skip = (page - 1) * limit;

    const users = await User.find().skip(skip).limit(Number(limit));
    // console.log(users.length)

    if (users.length > 0) {
      res.send(users);
    } else {
      res.send({ result: "no users found" });
    }
  } catch (error) {
    next(error);
  }
};


//GET CURRENT USER DATA
const getCurrentUserData = async (req, res, next) => {
  console.log("Current user id");
  console.log(req.body);
  try {
    let result = await User.findById({ _id: req.params.id });
    if (result) {
      res.send(result);
    } else {
      res.status(400).json({ Error: "No user found" });
    }
  } catch (e) {
    res.status(400).json({ Error: "Wrong user Id" });
  }
};

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { firstName: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

// Register the issue
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, userRole } =
    req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    userRole,
    // deviceToken,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      deviceToken: user.deviceToken,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

//AUTHENTICATE THE USER
const authUser = asyncHandler(async (req, res) => {
 const { email, password, deviceToken } = req.body;
 let user = await User.findOne({ email });

 if (!email) {
    res.status(400).json({ Error: "Email can't be blank" });
   return;
 }

 if (!password) {
   res.status(400).json({ Error: "Password can't be blank" });
   return;
 }

 if (!user) {
   res.status(401).json({ Error: "Invalid Email" });
   return;
 }

 if (await user.matchPassword(password)) {
   const { _id, email, deviceTokens } = user;

   // Check if deviceToken is provided and it's different from the existing one
   if (deviceToken && (!deviceTokens || !deviceTokens.includes(deviceToken))) {
     // Remove the existing deviceToken, if any
     if (deviceTokens && deviceTokens.length > 0) {
       await User.updateOne({ _id }, { $pull: { deviceTokens: { $in: deviceTokens } } });
     }

     // Add the new deviceToken
     await User.updateOne({ _id }, { $push: { deviceTokens: deviceToken } });

     // Fetch the updated user data
     user = await User.findById(_id);
   }

   res.json({
     _id,
     email,
     deviceTokens: user.deviceTokens,
     token: generateToken(_id),
   });
 } else {
   res.status(401).json({ Error: "Invalid Email or Password" });
 }
});

//LOGOUT THE USER
const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const deviceToken = req.body.deviceToken; // Assuming the device token is passed in the request body

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ Error: "User not found" });
    }

    // Find and remove the specified device token from the deviceTokens array
    user.deviceTokens = user.deviceTokens.filter((token) => token !== deviceToken);

    // Update the user's deviceTokens and token fields
    await User.updateOne(
      { _id: userId },
      { $set: { deviceTokens: user.deviceTokens, token: '' } }
    );

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ Error: "Failed to logout" });
  }
});


// Export the modules

module.exports = {
  allUsers,
  registerUser,
  authUser,
  getData,
  getCurrentUserData,
  logout,
};
