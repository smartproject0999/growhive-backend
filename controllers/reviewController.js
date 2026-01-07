const Review = require('../models/Review');
const Equipment = require('../models/Equipment');
// ➤ GET Reviews by Equipment ID
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      equipmentId: req.params.equipmentId
    })
    .populate("userId", "firstName lastName")
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
    const { equipmentId, rating, review, userId } = req.body;

    if (!equipmentId || !rating || !review || !userId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 🔹 FETCH EQUIPMENT (THIS WAS MISSING / BROKEN)
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    // 🚫 BLOCK OWNER REVIEW
    if (equipment.ownerId.toString() === userId.toString()) {
      return res.status(403).json({
        error: "You cannot review your own equipment"
      });
    }

    // 🚫 BLOCK DUPLICATE REVIEW
    const alreadyReviewed = await Review.findOne({
      equipmentId,
      userId
    });

    if (alreadyReviewed) {
      return res.status(409).json({
        error: "You have already reviewed this equipment"
      });
    }

    // ✅ SAVE REVIEW
    const newReview = new Review({
      equipmentId,
      userId,
      rating,
      review
    });

    await newReview.save();

    res.status(201).json({
      message: "Review added successfully",
      review: newReview
    });

  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
