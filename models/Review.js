const express = require('express');
const router = express.Router();
const { getReviews, addReview } = require('../controllers/reviewController');

router.get('/reviews/:equipmentId', getReviews);
router.post('/reviews', addReview);

module.exports = router;