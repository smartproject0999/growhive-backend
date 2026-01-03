const mongoose = require("mongoose");

const completedBookingSchema = new mongoose.Schema({
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

  startDate: Date,
  endDate: Date,
  totalPrice: Number,

  paymentId: String,
  paymentMethod: String,
  paymentStatus: String,

  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "CompletedBooking",
  completedBookingSchema
);
