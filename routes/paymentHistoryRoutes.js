const express = require("express");
const router = express.Router();
const {
  addPayment,
  getUserPayments,
  getOwnerPayments,
} = require("../controllers/paymentHistoryController");

router.post("/add", addPayment);
router.get("/user/:userId", getUserPayments);
router.get("/owner/:ownerId", getOwnerPayments);

module.exports = router;
