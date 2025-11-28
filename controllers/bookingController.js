const Booking = require("../models/Booking");

exports.createBooking = async (req, res) => {
  try {
    const { equipmentId, userId, startDate, endDate, totalPrice, notes } = req.body;

    // 1⃣ Validate input
    if (!equipmentId || !userId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 2⃣ Prevent double booking
    const existingBooking = await Booking.findOne({
      equipmentId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: { $ne: "Cancelled" }
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Equipment already booked for these dates" });
    }

    // 3⃣ Create booking
    const newBooking = await Booking.create({
      equipmentId,
      userId,
      startDate,
      endDate,
      totalPrice,
      notes,
      status: "Pending"
    });

    res.status(201).json({ message: "Booking successful", booking: newBooking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 📌 Get bookings by User (for user history)
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate("equipmentId userId");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 📌 Get bookings by Equipment Owner (owner dashboard)
exports.getOwnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "equipmentId",
        match: { ownerId: req.params.ownerId }
      })
      .populate("userId");
      
    res.json(bookings.filter(b => b.equipmentId !== null));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 📌 Update Booking Status (Approve / Cancel)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ message: "Status updated", booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
