require('dotenv').config();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
        user: process.env.EMAIL, // Gmail
        pass: process.env.PASSWORD // Gmail App Password
    }
});

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Register user and send OTP
const registerUser = async (req, res) => {
    const { firstName, lastName, email, password, userType } = req.body;

    if (!firstName || !lastName || !email || !password || !userType) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOTP();

       await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: 'Smart Urban Farming System - OTP Verification',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Email OTP - Smart Urban Farming System</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                color: #333;
                background: linear-gradient(135deg, #a8e6cf, #dcedc1);
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .container {
                max-width: 500px;
                border-radius: 15px;
                background-color: #fff;
                padding: 25px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                animation: fadeIn 1s ease-in-out;
                text-align: center;
                transition: transform 0.3s ease;
            }
            .container:hover { transform: scale(1.02); }
            .logo {
                display: block;
                margin: auto;
                width: 90px;
                height: 90px;
                border-radius: 50%;
                background-color: #e8f5e9;
                padding: 10px;
            }
            h1 { color: #2e7d32; font-size: 26px; margin: 15px 0; }
            .line { border-top: 2px dashed #a5d6a7; margin: 15px 0 25px 0; }
            p { font-size: 16px; margin: 8px 0; }
            .otp {
                background-color: #e8f5e9;
                display: inline-block;
                padding: 15px 30px;
                font-size: 36px;
                font-weight: bold;
                color: #1b5e20;
                letter-spacing: 5px;
                border-radius: 10px;
                box-shadow: inset 0 0 10px rgba(46, 125, 50, 0.2);
                animation: pulse 1.5s infinite;
            }
            .note { font-size: 14px; color: #777; margin-top: 15px; }
            .thank { margin-top: 20px; font-weight: bold; font-size: 16px; color: #388e3c; }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="https://cdn-icons-png.flaticon.com/512/2909/2909769.png" alt="App Logo" class="logo">
            <h1>Smart Urban Farming System</h1>
            <div class="line"></div>
            <p>Dear User,</p>
            <p>Welcome to <strong>Smart Urban Farming System</strong> — your partner in modern and sustainable farming solutions.</p>
            <p>To proceed further in the application, please enter the following One-Time Password (OTP):</p>
            <div class="otp">${otp}</div>
            <p class="note">Please use this OTP to complete your login process. Do not share this code with anyone.</p>
            <p class="thank">🌱 Thank you for choosing Smart Urban Farming System! 🌱</p>
        </div>
    </body>
    </html>
    `
});


        // Save user with OTP & expiry
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            userType,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000 // 5 minutes
        });

        await newUser.save();

        res.status(201).json({
            message: "OTP sent to your email. Please verify to continue.",
            email: newUser.email
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Verify OTP
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
        if (user.otp !== otp) return res.status(401).json({ error: 'Invalid OTP' });
        if (user.otpExpiry < Date.now()) return res.status(400).json({ error: 'OTP expired' });

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });

    } catch (err) {
        console.error('OTP Verification Error:', err);
        res.status(500).json({ error: 'Server error during verification' });
    }
};

// ✅ Login user


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect Password" });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d' // valid for 7 days
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Forgot password - send OTP
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
            subject: 'Password Reset OTP - Smart Urban Farming System',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OTP Email</title>
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        margin: 0;
        padding: 0;
    }
    .email-container {
        max-width: 420px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
    }
    .logo {
        margin-bottom: 10px;
    }
    .logo img {
        width: 70px;
    }
    .title {
        font-size: 20px;
        font-weight: bold;
        color: #0b8f27;
        margin: 5px 0;
    }
    .divider {
        border-top: 1px dashed #b8deb8;
        margin: 10px 0;
    }
    .message {
        font-size: 15px;
        color: #555555;
        font-weight: 550;
        font-family: 'Roboto', Arial, sans-serif;
        margin: 15px 0;
    }
    .otp-box {
        background: #eaf7ea;
        color: #0b8f27;
        font-size: 28px;
        font-weight: bold;
        padding: 12px;
        border-radius: 8px;
        display: inline-block;
        margin: 15px 0;
    }
    .note {
        font-size: 13px;
        color: #4d6f8b;
        margin-top: 15px;
    }
    .footer {
        margin-top: 20px;
        font-size: 14px;
        color: #0b8f27;
        font-weight: bold;
    }
</style>
</head>
<body>

<div class="email-container">
    <div class="logo">
        <img src="https://cdn-icons-png.flaticon.com/512/2909/2909769.png" alt="logo">
    </div>
    <div class="title">Smart Urban Farming <br>System</div>
    <div class="divider"></div>
    <div class="message">
        Dear User,<br>
        We received a request to reset your <br> password for your account.
    </div>
    <div class="otp-box">${otp}</div>
    <div class="note">
Please use this OTP to complete the password<br> reset process.
Do not share this code with <br> anyone.
    </div>
    <div class="footer">
        🌱 Thank you for using Smart Urban <br>Farming System!
    </div>
</div>
</body>
</html>`
        });

        res.json({ message: "OTP sent to your email" });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Verify reset OTP

const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
        if (user.otpExpiry < Date.now()) return res.status(400).json({ error: "OTP expired" });

        user.isVerified = true; // Mark only for reset flow
        await user.save();

        res.json({ message: "OTP verified successfully" });
    } catch (err) {
        console.error("Verify Reset OTP Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


// Reset password

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



// users profile (Authenticated)

const getProfile = async (req, res) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authorization token missing or invalid" });
        }

        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by decoded id
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


// Export all
module.exports = {
    registerUser,
    verifyOtp,
    loginUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    getProfile,
};

module.exports = { registerUser, verifyOtp, loginUser,forgotPassword,verifyResetOtp,resetPassword,getProfile};