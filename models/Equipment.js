const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true }, // Now from Cloudinary
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  location: { type: String, required: true },
  capacity: { type: String },
  price: { type: Number, required: true },
  description: { type: String }, // ← You were already collecting this
  category: { type: String, default: "General" }, // ← Good for filtering later
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Equipment", equipmentSchema);
