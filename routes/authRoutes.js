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
  updateProfile,
   deleteAccount
} = require('../controllers/authController');

// Existing routes
router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);


router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.get("/profile", getProfile);
router.put("/profile/update", updateProfile);
router.delete("/delete-account", deleteAccount); 


module.exports = router;