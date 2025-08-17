const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes'); // ✅ Equipment routes
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6000;


// ----------------- Mail Transporter -----------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  secure: false,
  port: 587,
  auth: {
    user: process.env.EMAIL,   // ✅ Must match .env
    pass: process.env.PASSWORD // ✅ Gmail App Password
  }
});

// ----------------- Middleware -----------------
app.use(cors());
app.use(express.json());

// ----------------- Health Check -----------------
app.get('/', (req, res) => {
  res.send('✅ GrowHive Backend is working!');
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

// ----------------- Routes -----------------
app.use('/api/auth', authRoutes);           // Auth routes
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

