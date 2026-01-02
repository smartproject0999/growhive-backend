// bookingController.js (add these handlers; keep your existing ones too)
const Booking = require("../models/Booking");
const mongoose = require("mongoose");


// 1) Check availability
exports.checkAvailability = async (req, res) => {
  try {
    const { equipmentId, startDate, endDate } = req.body;
    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const s = new Date(startDate);
    const e = new Date(endDate);

    const existingBooking = await Booking.findOne({
      equipmentId,
      startDate: { $lte: e },
      endDate: { $gte: s },
      status: { $ne: "Cancelled" }
    });

    if (existingBooking) {
      return res.status(200).json({ available: false, message: "Not available for selected dates." });
    }

    // if you want, compute price server-side (example placeholder)
    // const totalPrice = computePrice(equipmentId, s, e);
    // for now assume client passed totalPrice or server returns a calculated value
    return res.status(200).json({ available: true, message: "Equipment available" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 2) Create booking AFTER successful payment (idempotent-ish)
exports.createBookingAfterPayment = async (req, res) => {
  try {
    const { equipmentId, userId, startDate, endDate, totalPrice, notes, paymentId, paymentMethod } = req.body;

    if (!equipmentId || !userId || !startDate || !endDate || !totalPrice || !paymentId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const s = new Date(startDate);
    const e = new Date(endDate);

    // Double-check availability again (important)
    const existingBooking = await Booking.findOne({
      equipmentId,
      startDate: { $lte: e },
      endDate: { $gte: s },
      status: { $ne: "Cancelled" }
    });

    if (existingBooking) {
      // NOTE: you might want to issue refund here since payment already took place.
      return res.status(400).json({ message: "Equipment already booked for these dates (post-payment). Please request refund." });
    }
    const equipment = await Equipment.findById(equipmentId);
    const newBooking = await Booking.create({
      equipmentId,
      userId,
      equipmentOwnerId: equipment.ownerId,
      startDate: s,
      endDate: e,
      totalPrice,
      notes,
      paymentId,
      paymentMethod,
      paymentStatus: "Paid",
      status: "Confirmed"
    });

    return res.status(201).json({ message: "Booking created", booking: newBooking });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
    const bookings = await Booking.find({
      equipmentOwnerId: req.params.ownerId
    })
      .populate("equipmentId", "name imageUrl location price")
      .populate("userId", "name phone location");

    res.json(bookings);
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
