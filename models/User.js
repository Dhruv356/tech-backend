const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "seller"], default: "user" },

  sellerRequest: { type: Boolean, default: false }, // ✅ Fix: Add sellerRequest field

  profileImage: { type: String, default: "" },
  address: { type: String, default: "" },
  phoneNumber: { type: String, default: "" },
  shippingAddress: { type: String, default: "" },
});

module.exports = mongoose.model("User", userSchema);
