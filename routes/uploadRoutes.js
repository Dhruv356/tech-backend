const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

// Upload Profile Picture
router.post("/upload-profile-image", authMiddleware, upload.single("profileImage"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imageUrl = `/uploads/${req.file.filename}`;
  await User.findByIdAndUpdate(req.userId, { profileImage: imageUrl });

  res.json({ message: "Profile image updated", profileImage: imageUrl });
});

module.exports = router;
