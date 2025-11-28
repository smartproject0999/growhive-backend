const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  updateBookingStatus
} = require('../controllers/bookingController');

// 📌 Routes
router.post('/create', createBooking);
router.get('/user/:userId', getUserBookings);
router.get('/owner/:ownerId', getOwnerBookings);
router.put('/status/:id', updateBookingStatus);

module.exports = router;
