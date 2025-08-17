const Equipment = require("../models/Equipment");

// ➕ Add new equipment (Owner only)
exports.addEquipment = async (req, res) => {
  try {
    const { name, imageUrl, location, capacity, price } = req.body;

    if (!name || !location || !price) {
      return res.status(400).json({ error: "Name, location, and price are required" });
    }

    const equipment = new Equipment({
      name,
      imageUrl,
      location,
      capacity,
      price,
      ownerId: req.user._id
    });

    await equipment.save();
    res.status(201).json(equipment);
  } catch (err) {
    console.error("Add Equipment Error:", err);
    res.status(500).json({ error: "Failed to add equipment" });
  }
};

// 🌍 Get equipment by city
exports.getNearbyEquipment = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: "City is required" });

    const equipments = await Equipment.find({
      location: { $regex: city, $options: "i" }
    }).limit(20);

    res.json(equipments);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ⭐ Get top rated
exports.getTopRatedEquipment = async (req, res) => {
  try {
    const equipments = await Equipment.find()
      .sort({ rating: -1, reviews: -1 })
      .limit(20);

    res.json(equipments);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// 📦 Seed default sample (Owner only)
exports.seedEquipment = async (req, res) => {
  try {
    const sampleData = [
      {
        name: "Standard Bucket with attachments",
        imageUrl: "https://example.com/standard-bucket.jpg",
        rating: 4.8,
        reviews: 73,
        location: "Morbi, Gujarat",
        capacity: "3000 litres",
        price: 800,
        ownerId: req.user._id
      },
      {
        name: "Plough with fresh edged teeths",
        imageUrl: "https://example.com/plough.jpg",
        rating: 4.9,
        reviews: 104,
        location: "Rajkot, Gujarat",
        capacity: "488 m2",
        price: 600,
        ownerId: req.user._id
      }
    ];

    await Equipment.insertMany(sampleData);
    res.json({ message: "Sample equipment inserted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed data" });
  }
};
