const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config(); // dotenv 

const router = express.Router();

// ✅ Function to get JWT Secret Key Safely
const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }
  return process.env.JWT_SECRET;
};

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password:hashedPassword, role });

    await newUser.save();
    
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      getJwtSecret(),
      { expiresIn: "1h" }
    );

    res.status(201).json({ token, message: "User registered successfully" });

  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== role) {
      return res.status(403).json({ message: "Invalid role selected" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { userId: user._id, role: user.role ,name:user.name},
      getJwtSecret(),
      { expiresIn: "1h" }
    );

    res.json({ token, message: "Login successful" });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
