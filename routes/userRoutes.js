const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get User Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🟢 Update User Profile (Address, Phone, Shipping Address, etc.)
router.post("/profile", authMiddleware, async (req, res) => {
  try {
    const { address, phoneNumber, shippingAddress } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { address, phoneNumber, shippingAddress },
      { new: true } // Returns updated user
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
// Update Address
router.post("/update-address", authMiddleware, async (req, res) => {
  const { address } = req.body;
  await User.findByIdAndUpdate(req.userId, { address });
  res.json({ message: "Address updated successfully" });
});

// Update Phone Number
router.post("/update-phone-number", authMiddleware, async (req, res) => {
  const { phoneNumber } = req.body;
  await User.findByIdAndUpdate(req.userId, { phoneNumber });
  res.json({ message: "Phone number updated successfully" });
});

// Update Shipping Address
router.post("/update-shipping-address", authMiddleware, async (req, res) => {
  const { shippingAddress } = req.body;
  await User.findByIdAndUpdate(req.userId, { shippingAddress });
  res.json({ message: "Shipping address updated successfully" });
});
// router.post('/request-seller', authMiddleware, async (req, res) => {
//   const user = await User.findById(req.userId);

//   if (user.role !== 'user') {
//     return res.status(400).json({ message: 'You are already a seller or admin.' });
//   }

//   if (user.sellerRequest === 'pending') {
//     return res.status(400).json({ message: 'Request already pending.' });
//   }

//   user.sellerRequest = 'pending';
//   await user.save();

//   res.json({ message: 'Seller request submitted successfully.' });
// });



// 🟢 User requests to become a seller
router.post("/request-seller", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (user.role !== "user") {
      return res.status(400).json({ message: "You are already a seller or admin." });
    }

    if (user.sellerRequest) {
      return res.status(400).json({ message: "Request already pending." });
    }

    user.sellerRequest = true;
    await user.save();

    res.json({ message: "Seller request submitted successfully." });
  } catch (error) {
    console.error("Seller Request Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 🟢 Admin gets all pending seller requests
router.get("/admin/seller-requests", authMiddleware, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const requests = await User.find({ sellerRequest: true, role: "user" });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch seller requests.", error: error.message });
  }
});

// 🟢 Admin approves/rejects a seller request
router.post("/admin/approve-seller", authMiddleware, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const { userId, action } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (action === "approved") {
      user.role = "seller";
      user.sellerRequest = false;
    } else if (action === "rejected") {
      user.sellerRequest = false;
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }

    await user.save();
    res.status(200).json({ message: `User ${action} as seller.` });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve seller.", error: error.message });
  }
});
module.exports = router;
