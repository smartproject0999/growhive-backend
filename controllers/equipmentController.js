const Equipment = require("../models/Equipment");
const fs = require("fs");
const cloudinary = require("../config/cloudinary"); // 👈 Correct path

// ➕ Add new equipment (Owner only, with image upload)
exports.addEquipment = async (req, res) => {
  try {
    console.log("REQ FILE:", req.file); // 👈 Check if Multer got image

    const { name, location, capacity, price, description } = req.body;

    if (!name || !location || !price) {
      return res.status(400).json({ error: "Name, location, and price are required" });
    }

    let imageUrl = "";
    if (req.file) {
      console.log("Uploading to Cloudinary...");
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "equipment_images",
      });
      console.log("UPLOAD RESULT:", uploadResult);

      imageUrl = uploadResult.secure_url;
      fs.unlinkSync(req.file.path); // Clean temp file
    } else {
      return res.status(400).json({ error: "Image is required" });
    }

    // Save to DB
    const equipment = new Equipment({
      name,
      imageUrl,
      location,
      capacity,
      price,
      description,
      ownerId: req.user._id,
    });
await equipment.save();

  const fullEquipment = await Equipment.findById(equipment._id)
  .populate('ownerId', 'firstName lastName email phone');


res.status(201).json(fullEquipment);
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
    })
    .populate('ownerId', 'firstName lastName email phone')

    res.json(equipments);
  } catch (err) {
    console.error("Nearby Equipment Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ⭐ Get top rated
exports.getTopRatedEquipment = async (req, res) => {
  try {
    const equipments = await Equipment.find()
      .sort({ rating: -1, reviews: -1 })
      .populate('ownerId', 'firstName lastName email phone')

    res.json(equipments);
  } catch (err) {
    console.error("Top Rated Error:", err);
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
    console.error("Seed Error:", err);
    res.status(500).json({ error: "Failed to seed data" });
  }
};

// 📋 Get all equipment (with seller details)
exports.getAllEquipment = async (req, res) => {
  try {
    const equipments = await Equipment.find()
      .populate("ownerId", "firstName lastName email phone fullName");

    res.status(200).json(equipments);
  } catch (err) {
    console.error("Get All Equipment Error:", err);
    res.status(500).json({ error: "Failed to fetch equipment list" });
  }
};
