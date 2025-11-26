const Review = require('../models/Review');

// ➤ GET Reviews by Equipment ID
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ equipmentId: req.params.equipmentId })
                                .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ➤ POST New Review
exports.addReview = async (req, res) => {
  try {
    const { equipmentId, rating, review, userName } = req.body;

    if (!equipmentId || !rating || !review || !userName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newReview = new Review({ equipmentId, rating, review, userName });
    await newReview.save();

    res.status(201).json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
