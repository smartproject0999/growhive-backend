// bookingController.js (add these handlers; keep your existing ones too)
const Booking = require("../models/Booking");
const mongoose = require("mongoose");
const Equipment = require("../models/Equipment");
const CompletedBooking = require("../models/CompletedBooking");


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
      status: { $in: ["confirmed", "completed"] }
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
    const { equipmentId, userId, startDate, endDate, totalPrice, notes, paymentId, paymentMethod,address } = req.body;

    // if (!equipmentId || !userId || !startDate || !endDate || !totalPrice || !paymentId ) {
    //   return res.status(400).json({ message: "Missing required fields" });
    // }

    if (
  !equipmentId ||
  !userId ||
  !startDate ||
  !endDate ||
  !totalPrice ||
  !paymentId ||
  !address ||
  !address.fullAddress ||
  !address.city ||
  !address.state ||
  !address.pincode
) {
  return res.status(400).json({ message: "Missing required fields" });
}


     const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // 🚫 BLOCK OWNER BOOKING OWN EQUIPMENT
    if (equipment.ownerId.toString() === userId.toString()) {
      return res.status(403).json({
        message: "You cannot rent your own equipment"
      });
    } 
    
    

    const s = new Date(startDate);
    const e = new Date(endDate);

    // Double-check availability again (important)
    const existingBooking = await Booking.findOne({
      equipmentId,
      startDate: { $lte: e },
      endDate: { $gte: s },
      status: { $in: ["confirmed", "completed"] }
    });

    if (existingBooking) {
      // NOTE: you might want to issue refund here since payment already took place.
      return res.status(400).json({ message: "Equipment already booked for these dates (post-payment). Please request refund." });
    }
    // const equipment = await Equipment.findById(equipmentId);
    const newBooking = await Booking.create({
      equipmentId,
      userId,
      equipmentOwnerId: equipment.ownerId,
      startDate: s,
      endDate: e,
      totalPrice,
      ownerEarning: totalPrice, 
      notes,
      address,
      paymentId,
      paymentMethod,
      paymentStatus: "paid",
      status: "confirmed"
    });

    return res.status(201).json({ message: "Booking created", booking: newBooking });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}; 

// 3) Create COD booking request (WAITING FOR OWNER)
exports.createCODBookingRequest = async (req, res) => {
  try {
    const {
      equipmentId,
      userId,
      startDate,
      endDate,
      totalPrice,
      notes,
      address
    } = req.body;

    if (
      !equipmentId ||
      !userId ||
      !startDate ||
      !endDate ||
      !totalPrice ||
      !address
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // 🚫 Owner cannot book own equipment
    if (equipment.ownerId.toString() === userId.toString()) {
      return res.status(403).json({
        message: "You cannot rent your own equipment"
      });
    }

    const s = new Date(startDate);
    const e = new Date(endDate);

    // availability check
    const conflict = await Booking.findOne({
      equipmentId,
      startDate: { $lte: e },
      endDate: { $gte: s },
      status: { $in: ["confirmed", "completed"] }
    });

    if (conflict) {
      return res.status(400).json({
        message: "Equipment not available for selected dates"
      });
    }

    const booking = await Booking.create({
      equipmentId,
      userId,
      equipmentOwnerId: equipment.ownerId,
      startDate: s,
      endDate: e,
      totalPrice,
      ownerEarning: totalPrice,
      notes,
      address,

      paymentMethod: "cod",
      paymentStatus: "pending",

      bookingApprovalStatus: "pending_owner",
      approvalExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hrs

      status: "pending"
    });

    return res.status(201).json({
      message: "COD request sent to owner",
      booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4) Owner approves or rejects COD request
exports.ownerDecisionOnCOD = async (req, res) => {
  try {
    console.log("COD DECISION HIT:", req.params.id);

    const { decision } = req.body; // approve | reject
    const booking = await Booking.findById(
      new mongoose.Types.ObjectId(req.params.id)
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

     if (booking.bookingApprovalStatus !== "pending_owner") {
      return res.status(400).json({
        message: "Booking already processed"
      });
    }

    if (decision === "approve") {
      booking.bookingApprovalStatus = "approved";
      booking.status = "confirmed";
      booking.paymentStatus = "pending"; // COD cash later
    }

     if (decision === "reject") {
      booking.bookingApprovalStatus = "rejected";
      booking.status = "cancelled";
    }

    // booking.ownerDecisionAt = new Date();
     await booking.save(); 
 
    res.json({
      message: `Booking ${decision}d successfully`,
      booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5 Mark COD as Paid

exports.markCODPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentMethod !== "cod") {
      return res.status(400).json({ message: "Not a COD booking" });
    }

    booking.paymentStatus = "paid";
    booking.status = "completed";

    await booking.save();

    res.json({
      message: "COD payment marked as paid",
      booking
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 📌 Farmer: Get COD booking status
exports.getFarmerCODBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.params.userId,
      paymentMethod: "cod"
    })
      .sort({ createdAt: -1 })
      .populate("equipmentId", "name imageUrl location price")
      .populate("equipmentOwnerId", "firstName lastName phone");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 📌 Owner : Get COD booking status
exports.getownerCODBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.params.userId,
      paymentMethod: "cod"
    })
      .sort({ createdAt: -1 })
      .populate("equipmentId", "name imageUrl location price")
      .populate("equipmentOwnerId", "firstName lastName phone");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

exports.getPayment = async (req, res) => {
  try {
    const Completed = await CompletedBooking.find({ userId: req.params.userId })
      .populate("equipmentId userId");
    res.json(Completed);
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
        .sort({ bookingApprovalStatus: -1, createdAt: -1 })
        .populate("equipmentId", "name imageUrl location price")
        .populate("userId", "firstName lastName phone");


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

// income api 

exports.getOwnerTotalIncome = async (req, res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.params.ownerId);

    const bookingIncome = await Booking.aggregate([
      {
        $match: {
          equipmentOwnerId: ownerId,
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$ownerEarning" }
        }
      }
    ]);

    const completedIncome = await CompletedBooking.aggregate([
      {
        $match: {
          equipmentOwnerId: ownerId,
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$ownerEarning" }
        }
      }
    ]);

    const totalIncome =
      (bookingIncome[0]?.total || 0) +
      (completedIncome[0]?.total || 0);

    res.json({ totalIncome });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};