const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }  // TTL: remove document after expiresAt
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);
