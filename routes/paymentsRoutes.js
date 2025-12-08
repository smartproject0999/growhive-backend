const express = require("express");
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPaymentSignature,
} = require("../controllers/paymentsController");

// Create Razorpay payment order
router.post("/create-order", createRazorpayOrder);

// Verify payment signature (optional, but recommended)
router.post("/verify-payment", verifyPaymentSignature);

module.exports = router;
