// controllers/paymentsController.js
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 📌 Create Razorpay Order (Used before opening payment gateway)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const options = {
      amount: Math.round(amount * 100), // convert rupees → paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json(order);
  } catch (error) {
    console.log("Razorpay Order Error:", error);
    res.status(500).json({ error: "Error creating Razorpay order" });
  }
};

// 📌 Verify Razorpay Payment (Optional if needed)
exports.verifyPaymentSignature = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const body = orderId + "|" + paymentId;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === signature) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(400).json({ valid: false });
    }

  } catch (error) {
    res.status(500).json({ error: "Payment verification failed" });
  }
};
