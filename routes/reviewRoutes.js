
const express = require('express');
const router = express.Router();
const { addReview, getReviews } = require('../controllers/reviewController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/reviews', authMiddleware, addReview);      // POST review, user must be logged in
router.get('/reviews/:equipmentId', getReviews);        // GET reviews, public

module.exports = router;
