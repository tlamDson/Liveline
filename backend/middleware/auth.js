const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Try to use MongoDB User model first, fallback to FileUser
let User;
try {
  User = require("../models/User");
} catch (error) {
  console.log("MongoDB User model not available in auth middleware");
}

const FileUser = require("../models/FileUser");

// Helper function to choose the right User model
const getUserModel = () => {
  if (mongoose.connection.readyState === 1 && User) {
    return User;
  }
  return FileUser;
};

const auth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Store user ID for routes to use

    // Get user from database
    const UserModel = getUserModel();
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = auth;
