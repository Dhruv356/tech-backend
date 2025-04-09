const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User"); 
const sendEmail = require("../utills/emailsevice"); 
const router = express.Router();
const sendInvoiceEmail = require("../utills/invoiceservices");

// ✅ Place Order (User)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, address, phone, paymentMethod, cartItems, totalPrice } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty!" });
    }

    console.log("🟢 Received Order Request:", req.body);

    const items = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);

        if (!product) {
          throw new Error(`❌ Product with ID ${item.productId} not found!`);
        }

        return {
          productId: item.productId,
          sellerId: product.sellerId,
          name: item.name,
          price: item.price,
          quantity: item.qty,
          image: item.imgUrl || "/uploads/default.png",
        };
      })
    );

    const order = new Order({
      userId: req.userId,
      items,
      totalPrice,
      shippingAddress: address,
      phone,
      paymentMethod,
      status: "Pending",
    });

    await order.save();

    console.log("✅ Order Saved:", order);

    // ✅ Fetch user's email
    const user = await User.findById(req.userId);
    if (user) {
      // ✅ Generate invoice PDF buffer
      const invoiceBuffer = await sendInvoiceEmail(order, user);

      // ✅ Send confirmation email with PDF invoice attached
      await sendEmail(
        user.email,
        "🛍 Order Confirmation - TechTrove",
        `Hello ${user.name},\n\nYour order has been placed successfully! 🎉\n\n🆔 Order ID: ${order._id}\n💰 Total Amount: ₹${totalPrice}\n📦 Items Ordered: ${items
          .map((item) => `\n- ${item.name} (x${item.quantity})`)
          .join("")}\n\nThank you for shopping with us!\n\n🚀 TechTrove Team`,
        {
          filename: `invoice-${order._id}.pdf`,
          content: invoiceBuffer,
        }
      );

      console.log(`📄 Invoice email sent to: ${user.email}`);
    }

    res.status(201).json({ message: "Order placed successfully!", order });

  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ Get Orders for a User
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).populate("items.productId", "name price imageUrl");
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
//seller orders only
router.get("/seller-orders", authMiddleware, async (req, res) => {
  try {
    if (req.role !== "seller") {
      return res.status(403).json({ message: "Access denied" });
    }

    const orders = await Order.find({ "items.sellerId": req.userId })
      .populate("items.productId", "name price imageUrl sellerId")
      .populate("userId", "name email");



    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// ✅ Get All Orders for Admin
router.get("/admin-orders", authMiddleware, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.productId", "name price imageUrl");

    // ✅ Ensure correct status updates before sending response
    orders.forEach(order => {
      const allDelivered = order.items.every(item => item.status === "Delivered");
      if (allDelivered) {
        order.status = "Delivered";
      }
    });

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Update Order Status (For Sellers)
router.put("/update-status/:orderId/:productId", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId, productId } = req.params;

    if (!["Processing", "Shipped", "Delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    // ✅ First, find the order and update the specific item's status
    const order = await Order.findOne({ _id: orderId, "items.productId": productId, "items.sellerId": req.userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found or unauthorized" });
    }

    // ✅ Update the status of the specific product inside the order
    order.items.forEach((item) => {
      if (item.productId.toString() === productId) {
        item.status = status;
      }
    });

    // ✅ Check if all products are delivered
    const allDelivered = order.items.every(item => item.status === "Delivered");

    if (allDelivered) {
      order.status = "Delivered"; // ✅ Update main order status
    }

    await order.save(); // ✅ Save updated order

    res.json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
});


router.delete("/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.userId });

    if (!order) return res.status(404).json({ message: "Order not found!" });

    // ✅ Prevent cancellation if already shipped/delivered
    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Delivered orders cannot be canceled." });
    }

    await Order.findByIdAndDelete(req.params.orderId);
    res.status(200).json({ message: "Order canceled successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET Seller's Orders & Revenue
// GET Seller's Orders & Revenue
router.get("/seller/stats", authMiddleware, async (req, res) => {
  try {
    if (req.role !== "seller") {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Fetch all orders where any item is sold by the seller
    const orders = await Order.find({ "items.sellerId": req.userId });

    // ✅ Debugging - Check if orders are fetched
    console.log("Orders found for seller:", orders);

    let totalRevenue = 0; // ✅ Initialize to avoid null issues

    // ✅ Loop through orders to calculate revenue
    orders.forEach(order => {
      order.items.forEach(item => {
        // ✅ Fix ObjectId comparison & field name (`quantity` instead of `qty`)
        if (item.sellerId.toString() === req.userId) {
          totalRevenue += item.price * item.quantity; // ✅ Fix: Use `quantity`
        }
      });
    });

    res.status(200).json({
      totalOrders: orders.length,
      totalRevenue
    });

  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({ message: "Failed to fetch seller stats", error });
  }
});



module.exports = router;
