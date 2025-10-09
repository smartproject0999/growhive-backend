const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
} = require('../controllers/authController');

// Routes
router.post('/register', registerUser);        // Signup + send OTP (SMS)
router.post('/verify-otp', verifyOtp);         // Verify phone OTP after signup
router.post('/login', loginUser);              // Login with email + password

router.post('/forgot-password', forgotPassword); // Forgot password -> send OTP (SMS)
router.post('/verify-reset-otp', verifyResetOtp); // Verify reset OTP
router.post('/reset-password', resetPassword);   // Reset password
router.get('/profile', getProfile);              // Get profile (JWT protected)

module.exports = router;
