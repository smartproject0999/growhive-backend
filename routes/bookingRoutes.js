const express = require('express');
const router = express.Router();
const {
  // createBooking,
  getPayment,
  getUserBookings,
  getOwnerBookings,
  updateBookingStatus,
  checkAvailability,             
  createBookingAfterPayment,
  getOwnerTotalIncome 
} = require('../controllers/bookingController');

// 📌 Routes
// router.post('/create', createBooking);
router.get('/payment/:userId', getPayment);
router.get('/user/:userId', getUserBookings);
router.get('/owner/:ownerId', getOwnerBookings);
router.get('/owner-total-income/:ownerId', getOwnerTotalIncome);
router.put('/status/:id', updateBookingStatus);
router.post('/check-availability', checkAvailability);
router.post('/create-after-payment', createBookingAfterPayment);


module.exports = router;
