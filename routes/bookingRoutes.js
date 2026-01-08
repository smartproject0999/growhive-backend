const express = require('express');
const router = express.Router();
const {
  // createBooking,
  getPayment,
  getUserBookings,
  getOwnerBookings,
  updateBookingStatus,
  ownerDecisionOnCOD,
  markCODPaid,
  checkAvailability,             
  createBookingAfterPayment,
  createCODBookingRequest,
  getOwnerTotalIncome,
  getFarmerCODBookings,
  getownerCODBookings
} = require('../controllers/bookingController');

// 📌 Routes
// router.post('/create', createBooking);
router.get('/payment/:userId', getPayment);
router.get('/user/:userId', getUserBookings);
router.get('/farmer/cod/:userId', getFarmerCODBookings);
router.get('/owner/cod/:userId', getownerCODBookings);
router.get('/owner/:ownerId', getOwnerBookings);
router.get('/owner-total-income/:ownerId', getOwnerTotalIncome);
router.put('/status/:id', updateBookingStatus);
router.put('/cod-decision/:id', ownerDecisionOnCOD);
router.put("/cod-paid/:id", markCODPaid);
router.post('/check-availability', checkAvailability);
router.post('/create-after-payment', createBookingAfterPayment);
router.post('/cod-request', createCODBookingRequest);


module.exports = router;
