const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ Fixed import
const Order = require("../models/Order"); // ✅ FIXED: Import Order model
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
// ✅ Import mongoose to use ObjectId
const mongoose = require("mongoose");

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage: storage });

// ✅ NEW API: Admin Adds a Product

// ✅ Admin Add Product API

// ✅ Use a Dummy Admin ObjectId
const ADMIN_ID = new mongoose.Types.ObjectId("65e8a7f03f52a1c3d0d5b123"); // Replace with a valid ObjectId

// ✅ Admin Add Product API
router.post("/admin/add-product", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied! Admins only." });
    }

    const { productName, description, price, category } = req.body;
    if (!productName || !price || !description || !category) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ Use the Dummy Admin ID as sellerId
    const newProduct = new Product({
      productName,
      description,
      price,
      category,
      imageUrl,
      sellerId: ADMIN_ID, // ✅ Hardcoded valid ObjectId
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully!", newProduct });

  } catch (error) {
    console.error("❌ Error adding product (Admin):", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// ✅ Admin Login
router.post('/admin-login', (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { role: 'admin' }, // No userId needed if it's just a static admin
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      role: 'admin',
    });
  }

  res.status(401).json({ message: 'Invalid admin credentials' });
});
router.get('/users', authMiddleware, async (req, res) => {
    if (req.role !== 'admin') return res.status(403).json({ message: 'Access denied.' });
  
    try {
      const users = await User.find({});
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
    }
  });
  router.delete('/users/:id', authMiddleware, async (req, res) => {
    if (req.role !== 'admin') return res.status(403).json({ message: 'Access denied.' });
  
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user.', error: error.message });
    }
  });
  
  router.patch('/users/:id', authMiddleware, async (req, res) => {
    if (req.role !== 'admin') return res.status(403).json({ message: 'Access denied.' });
  
    const { role } = req.body;
    if (!['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
  
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      );
      res.json({ message: 'User role updated successfully.', user });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user role.', error: error.message });
    }
  });
  

// // ✅ Get Pending Seller Requests
// router.get('/seller-requests', authMiddleware, async (req, res) => {
//   try {
//     if (req.role !== 'admin') {
//       return res.status(403).json({ message: 'Access denied.' });
//     }

//     const requests = await User.find({ sellerRequest: 'pending' });
//     res.json(requests);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // ✅ Approve or Reject Seller Requests
// router.patch('/seller-requests/:id', authMiddleware, async (req, res) => {
//   try {
//     if (req.role !== 'admin') {
//       return res.status(403).json({ message: 'Access denied.' });
//     }

//     const { status } = req.body; // 'approved' or 'rejected'
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     if (status === 'approved') {
//       user.role = 'seller';
//       user.sellerRequest = 'approved';
//     } else if (status === 'rejected') {
//       user.sellerRequest = 'rejected';
//     } else {
//       return res.status(400).json({ message: 'Invalid status. Use "approved" or "rejected".' });
//     }

//     await user.save();
//     res.json({ message: `Seller request ${status}.` });

//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// ✅ Fetch Admin Dashboard Stats
router.get("/admin-dashboard", authMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Aggregate total revenue
    const revenueData = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Aggregate monthly sales
    const monthlySales = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Aggregate monthly revenue
    const monthlyRevenue = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      totalRevenue,
      totalSales: totalOrders,
      monthlySales,
      monthlyRevenue
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats.", error: error.message });
  }
});

module.exports = router;
