require('dotenv').config();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ Nodemailer Transporter (used only for Forgot Password)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Register User (Phone-based OTP via TextBee.dev)
const registerUser = async (req, res) => {
    const { firstName, lastName, email, phone, password, userType } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !userType) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Check if phone number is already registered
        const existingUser = await User.findOne({ phone });
        if (existingUser && existingUser.isVerified) {
            return res.status(409).json({ error: "Phone number already registered" });
        }

        // Hash password and generate OTP
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        const newUser = new User({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            userType,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000
        });

        await newUser.save();

        // ✅ Send OTP via TextBee.dev
        try {
            await axios.post(
                `https://api.textbee.dev/api/v1/gateway/devices/${process.env.DEVICE_ID}/send-sms`,
                {
                    recipients: [phone.startsWith('+') ? phone : `+91${phone}`],
                    message: `ayush ${otp}`,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.TEXTBEE_API_KEY,
                    },
                }
            );
            console.log(`✅ OTP ${otp} sent successfully to ${phone}`);
        } catch (smsError) {
            console.error("❌ Failed to send OTP via TextBee:", smsError.response?.data || smsError.message);
            return res.status(500).json({ error: "Failed to send OTP to phone number" });
        }

        res.status(201).json({
            message: "OTP sent to your phone. Please verify to continue.",
            phone: newUser.phone
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Verify OTP (Phone-based)
const verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required' });
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

        res.status(200).json({ message: 'Phone number verified successfully!' });
    } catch (err) {
        console.error('OTP Verification Error:', err);
        res.status(500).json({ error: 'Server error during verification' });
    }
};

// ✅ Login User
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect Password" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Forgot Password (Email-based)
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = Date.now() + 5 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset OTP - GrowHive',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center;">
                    <h2>GrowHive App</h2>
                    <p>Your OTP for password reset is:</p>
                    <h1 style="color: green;">${otp}</h1>
                    <p>Please use this OTP within 5 minutes. Do not share it with anyone.</p>
                </div>
            `
        });

        res.json({ message: "OTP sent to your email" });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Verify Reset OTP
const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
        if (user.otpExpiry < Date.now()) return res.status(400).json({ error: "OTP expired" });

        user.isVerified = true;
        await user.save();

        res.json({ message: "OTP verified successfully" });
    } catch (err) {
        console.error("Verify Reset OTP Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Reset Password
const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: "All fields are required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (!user.isVerified) return res.status(400).json({ error: "OTP not verified" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpiry = null;
        user.isVerified = false;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ User Profile
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
