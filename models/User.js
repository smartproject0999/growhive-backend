const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true }, // ✅ added this line
  password: { type: String, required: true },
  userType: { type: String, enum: ['farmer', 'owner'], required: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
