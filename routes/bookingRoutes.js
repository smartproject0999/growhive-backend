const express = require('express');
const router = express.Router();
const {
  // createBooking,
  getPayment,
  getUserBookings,
  getOwnerBookings,
  updateBookingStatus,
  checkAvailability,             
  createBookingAfterPayment 
} = require('../controllers/bookingController');

// 📌 Routes
// router.post('/create', createBooking);
router.get('/user/:userId', getPayment);
router.get('/user/:userId', getUserBookings);
router.get('/owner/:ownerId', getOwnerBookings);
router.put('/status/:id', updateBookingStatus);
router.post('/check-availability', checkAvailability);
router.post('/create-after-payment', createBookingAfterPayment);

module.exports = router;
