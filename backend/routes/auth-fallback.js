const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Try to use MongoDB User model first, fallback to FileUser
let User;
try {
  User = require("../models/User");
} catch (error) {
  console.log("MongoDB User model not available, using file-based storage");
}

const FileUser = require("../models/FileUser");
const auth = require("../middleware/auth");

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Helper function to choose the right User model
const getUserModel = () => {
  if (mongoose.connection.readyState === 1) {
    return User;
  }
  return FileUser;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be between 3 and 20 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username, email, password } = req.body;
      const UserModel = getUserModel();

      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        const field = existingUser.email === email ? "email" : "username";
        return res.status(400).json({
          message: `User with this ${field} already exists`,
        });
      }

      // Create new user
      const user = new UserModel({
        username,
        email,
        password,
      });

      await user.save();

      // Generate token
      const token = generateToken(user.id || user._id);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id || user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Handle specific MongoDB errors
      if (error.name === "MongooseServerSelectionError") {
        return res.status(503).json({
          message: "Database connection failed. Using temporary storage.",
        });
      }

      if (
        error.name === "MongooseError" &&
        error.message.includes("buffering timed out")
      ) {
        return res.status(503).json({
          message: "Database timeout. Using temporary storage.",
        });
      }

      res.status(500).json({
        message: "Server error during registration",
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      const UserModel = getUserModel();

      // Find user by email
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user.id || user._id);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id || user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", auth, (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const UserModel = getUserModel();
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    auth,
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be between 3 and 20 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("currentPassword")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Current password must be at least 6 characters long"),
    body("newPassword")
      .optional()
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
    body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const UserModel = getUserModel();
      const user = await UserModel.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { username, email, currentPassword, newPassword, avatar } =
        req.body;
      const updates = {};

      // Check if username is being changed and if it's available
      if (username && username !== user.username) {
        const existingUser = await UserModel.findOne({ username });
        if (
          existingUser &&
          (existingUser.id || existingUser._id) !== req.userId
        ) {
          return res.status(400).json({ message: "Username already taken" });
        }
        updates.username = username;
      }

      // Check if email is being changed and if it's available
      if (email && email !== user.email) {
        const existingUser = await UserModel.findOne({ email });
        if (
          existingUser &&
          (existingUser.id || existingUser._id) !== req.userId
        ) {
          return res.status(400).json({ message: "Email already taken" });
        }
        updates.email = email;
      }

      // Handle password change
      if (newPassword) {
        if (!currentPassword) {
          return res
            .status(400)
            .json({
              message: "Current password is required to change password",
            });
        }

        const isCurrentPasswordValid = await user.comparePassword(
          currentPassword
        );
        if (!isCurrentPasswordValid) {
          return res
            .status(400)
            .json({ message: "Current password is incorrect" });
        }

        updates.password = newPassword;
      }

      // Handle avatar update
      if (avatar !== undefined) {
        updates.avatar = avatar;
      }

      // Apply updates
      Object.assign(user, updates);
      await user.save();

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user.id || user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Server error during profile update" });
    }
  }
);

module.exports = router;
