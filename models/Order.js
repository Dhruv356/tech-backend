const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ Linked to seller
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: { type: String, required: true, default: "/placeholder.jpg" },
      status: { type: String, default: "Pending" }, // ✅ Each product has its own status
    },
  ],
  totalPrice: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  phone: { type: String, required: true },
  paymentMethod: { type: String, default: "COD" },
  status: { type: String, default: "Pending" }, // ✅ Order-level status
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
