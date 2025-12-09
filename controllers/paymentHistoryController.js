const Payment = require("../models/Payment");

// 📌 Add payment after booking
exports.addPayment = async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Get payments by user
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId })
      .populate("equipmentId bookingId userId");
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Get payments by equipment owner
exports.getOwnerPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: "equipmentId",
        match: { ownerId: req.params.ownerId }
      })
      .populate("bookingId userId");

    res.status(200).json(
      payments.filter(p => p.equipmentId !== null)
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
