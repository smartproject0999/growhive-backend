const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // still used for login
  phone: { type: String, required: true, unique: true }, // used for OTP verification
  password: { type: String, required: true },
  userType: { type: String, enum: ['farmer', 'owner'], required: true },
  otp: { type: String }, // store OTP temporarily
  otpExpiry: { type: Date }, // store OTP expiry time
  isVerified: { type: Boolean, default: false } // true after phone OTP is verified
});

module.exports = mongoose.model('User', userSchema);
