// Booking.js — extended with payment info (replace your current file)
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  equipmentOwnerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  ownerEarning: { type: Number, default: 0 },
  notes: { type: String },

  address: {
    fullAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },

  // payment fields
  paymentId: { type: String },         // gateway payment id
  paymentMethod: { type: String },     // e.g. razorpay
  paymentStatus: {                     // info from gateway
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },

  // booking stats (keeps existing states)
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
