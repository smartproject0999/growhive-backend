require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

// Twilio setup
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Register user and send OTP via SMS
const registerUser = async (req, res) => {
  const { firstName, lastName, email, phone, password, userType } = req.body;

  if (!firstName || !lastName || !email || !phone || !password || !userType) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check existing user by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Check existing user by phone
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({ error: "Phone number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Send OTP via SMS
    await client.messages.create({
      body: `Your OTP for Smart Urban Farming System is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: phone
    });

    // Save user with OTP & expiry
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      userType,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    await newUser.save();

    res.status(201).json({
      message: "OTP sent to your phone. Please verify to continue.",
      phone: newUser.phone
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Verify OTP via phone
const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  try {
    const user = await User.findOne({ phone });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
    if (user.otp !== otp) return res.status(401).json({ error: 'Invalid OTP' });
    if (user.otpExpiry < Date.now()) return res.status(400).json({ error: 'OTP expired' });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Phone number verified successfully' });

  } catch (err) {
    console.error('OTP Verification Error:', err);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

// ✅ Login user (by email + password, only after phone verification)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isVerified) {
      return res.status(400).json({ error: "Phone number not verified. Please complete OTP verification." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect Password" });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Forgot password (phone OTP)
const forgotPassword = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number is required" });

  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await client.messages.create({
      body: `Your password reset OTP for Smart Urban Farming System is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.json({ message: "OTP sent to your phone for password reset" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Verify reset OTP (phone)
const verifyResetOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP are required" });

  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
    if (user.otpExpiry < Date.now()) return res.status(400).json({ error: "OTP expired" });

    user.isVerified = true; // verified for reset
    await user.save();

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify Reset OTP Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Reset password
const resetPassword = async (req, res) => {
  const { phone, newPassword } = req.body;
  if (!phone || !newPassword) return res.status(400).json({ error: "All fields are required" });

  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isVerified) return res.status(400).json({ error: "OTP not verified" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.isVerified = false; // reset after password change
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Profile
const getProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password -otp -otpExpiry");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
};
