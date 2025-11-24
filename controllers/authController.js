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
                    message: `Your login request has been received. Please enter this 6-digit key ${otp} to continue. This key will expire shortly. `,
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

// ✅ Forgot Password 
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

        // 📩 Send OTP via TextBee SMS
        await axios.post(
            `https://api.textbee.dev/api/v1/gateway/devices/${process.env.DEVICE_ID}/send-sms`,
            {
                recipients: [phone.startsWith('+') ? phone : `+91${phone}`],
                message: `Your password reset OTP is ${otp}. It will expire in 5 minutes.`,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.TEXTBEE_API_KEY,
                },
            }
        );

        res.json({ message: "OTP sent to phone number" });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Verify Reset OTP

const verifyResetOtp = async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP are required" });

    try {
        const user = await User.findOne({ phone });
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

// ✅ Update Profile
const updateProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authorization token missing or invalid" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { firstName, lastName, email, phone } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            { firstName, lastName, email, phone },
            { new: true }
        ).select("-password -otp -otpExpiry");

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

//  Delete Account (User can delete their own account)
const deleteAccount = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authorization token missing or invalid" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const deletedUser = await User.findByIdAndDelete(decoded.id);

        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete Account Error:", error);
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
    updateProfile,
    deleteAccount,
};
