const jwt = require("jsonwebtoken");

 const generateToken = (id) => {
      // return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "2h" });
      return jwt.sign({ id }, "JWT_SECRET", { });
    };

module.exports = generateToken;
