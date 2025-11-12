const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6000;

// ----------------- Email Transporter (For Forgot Password) -----------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  secure: false,
  port: 587,
  auth: {
    user: process.env.EMAIL,    // Your email
    pass: process.env.PASSWORD  // Gmail app password
  }
});

// ----------------- TextBee Config (For Phone OTP) -----------------
const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY;
const DEVICE_ID = process.env.DEVICE_ID;
const otpStore = {}; // Temporary in-memory OTP store

// ----------------- Middleware -----------------
app.use(cors());
app.use(express.json());

// ✅ Make uploads folder public (important for images)
app.use("/uploads", express.static("uploads"));

// ----------------- Health Check -----------------
app.get('/', (req, res) => {
  res.send('✅ GrowHive Backend (TextBee + Email) is working!');
});

// ----------------- Test Email Route -----------------
app.get('/send-test-mail', async (req, res) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.TO_EMAIL,
      subject: 'GrowHive Test Mail',
      text: 'Your backend mail service is working!'
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: '✅ Test email sent successfully!' });
  } catch (err) {
    console.error('❌ Email Error:', err);
    res.status(500).json({ error: '❌ Failed to send email' });
  }
});

// ----------------- OTP (Phone Verification using TextBee) -----------------
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const otp = Math.floor(1000 + Math.random() * 9000);
  otpStore[phone] = otp;

  try {
    await axios.post(
      `https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/send-sms`,
      {
        recipients: [phone],
        message: `Your OTP code is ${otp}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEXTBEE_API_KEY,
        },
      }
    );

    console.log(`✅ OTP ${otp} sent to ${phone}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ TextBee Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;

  if (otpStore[phone] && otpStore[phone] == otp) {
    delete otpStore[phone];
    return res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});

// ----------------- Routes -----------------
app.use('/api/auth', authRoutes);           // Auth routes (signup/login)
app.use('/api/equipment', equipmentRoutes); // Equipment routes

// ----------------- MongoDB Connection -----------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
