const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes'); // ✅ ADD THIS LINE
const nodemailer = require('nodemailer');
const { text } = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;


const transporter = nodemailer.createTransport({
  service:'gmail',
  host: 'smtp.gmail.com',
  secure:false,
  port: 587,
  auth: {
    user: process.env.EMAIl,
    pass: process.env.PASSWORD
  }
})
// Middleware
app.use(cors());
app.use(express.json());

// Sample Route
app.get('/', (req, res) => {
  res.send('Backend is working!');
});


const mailOption = {
  from: process.env.EMAIL,
  to: process.env.TO_EMAIL,
  subject: 'Sending Email Using Node.js',
  text: 'That was easy',
}

transporter.sendMail(mailOption, (error,info)=> {
  if(error) {
    console.log(error);
  }
  else {
    console.log('Email sent : ',info.response);
  }
})
// ✅ Use auth routes (REGISTER YOUR ENDPOINTS)
app.use('/api/auth', authRoutes);

// MongoDB connection
mongoose.connect('mongodb+srv://GrowHive0999:GrowHive%400999@growhive.1966u6g.mongodb.net/growhive?retryWrites=true&w=majority&appName=GrowHive', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
