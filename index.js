require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const productRoutes = require("./routes/productroute"); // ✅ Import product routes
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")) ;                   // ✅ Serve uploaded images

// Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", uploadRoutes);
app.use("/api/products", productRoutes); // ✅ Add product routes
app.use("/api/orders", orderRoutes);
app.use("/api", adminRoutes);


  
// Connect to DB & Start Server
connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
