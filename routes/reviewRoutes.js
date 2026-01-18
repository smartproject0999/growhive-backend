const express = require('express');
const router = express.Router();

const { getReviews, addReview } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public: fetch reviews
router.get('/reviews/:equipmentId', getReviews);

// Protected: only logged-in users with completed booking
router.post('/reviews', authMiddleware, addReview);

module.exports = router;
