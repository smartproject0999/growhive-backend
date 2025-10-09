require('dotenv').config();
const twilio = require('twilio');

// Load from .env
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendTestSms() {
  try {
    const message = await client.messages.create({
      body: 'Hello 👋 This is a test SMS from your Node.js + Twilio setup!',
      from: process.env.TWILIO_PHONE,  // Your Twilio number (+12408202497)
      to: '+919313047543' // 👉 replace with YOUR verified phone number
    });
    console.log('✅ SMS sent successfully:', message.sid);
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
  }
}

sendTestSms();
