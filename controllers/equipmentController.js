const Equipment = require("../models/Equipment");
const fs = require("fs");
const cloudinary = require("../config/cloudinary"); // 👈 Correct path

// ➕ Add new equipment (Owner only, with image upload)
exports.addEquipment = async (req, res) => {
  try {
    console.log("REQ FILE:", req.file); // 👈 Check if Multer got image

    const { name, location, capacity, price, description,category } = req.body;

    if (!name || !location || !price || !category) {
      return res.status(400).json({ error: "Name, location, price and category are required" });
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
      category,
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
// ⭐ Get equipment by category
exports.getEquipmentByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    const equipments = await Equipment.find({ category })
      .populate("ownerId", "firstName lastName email phone");

    res.json(equipments);
  } catch (err) {
    console.error("Category API Error:", err);
    res.status(500).json({ error: "Failed to fetch equipment by category" });
  }
};

// 🟢 Get equipment listed by logged-in owner
exports.getMyListedEquipments = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const equipments = await Equipment.find({ ownerId })
      .populate("ownerId", "firstName lastName email phone");

    return res.status(200).json({
      success: true,
      count: equipments.length,
      equipments,
    });
  } catch (err) {
    console.error("Fetch My Listed Equipments Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ❌ Delete equipment (only if owner owns it)
exports.deleteEquipment = async (req, res) => {
  try {
    const equipmentId = req.params.id;
    const ownerId = req.user._id;

    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    if (equipment.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete" });
    }

    // Delete Cloudinary image (optional but recommended)
    if (equipment.imageUrl) {
      const publicId = equipment.imageUrl.split("/").slice(-1)[0].split(".")[0];
      await cloudinary.uploader.destroy(`equipment_images/${publicId}`);
    }

    await equipment.deleteOne();

    return res.status(200).json({ success: true, message: "Equipment deleted successfully" });
  } catch (err) {
    console.error("Delete Equipment Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};