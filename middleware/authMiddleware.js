const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, "JWT_SECRET");
      
      // Find the user by id and attach it to the request object
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401).json({Error: "Not authorized, user not found"});
        // throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      res.status(401).json({Error: "Invalid Token"});
    }
  }

  if (!token) {
    res.status(401).json({Error : "Not authorized, Token can not be blank"})
  }
});

module.exports = { protect };
