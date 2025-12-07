const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Equipment = require("../models/Equipment");

// const upload = require("../middleware/multer");

const equipmentController = require("../controllers/equipmentController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// ---------------- Multer Setup (for Cloudinary) ----------------

// Store image temporarily in memory (not permanently in uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp/"); // temporary folder (you may create it)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ---------------- Routes ----------------

// 🌍 Nearby equipment (Farmer & Owner can view)
router.get("/nearby", authMiddleware, equipmentController.getNearbyEquipment);

// ⭐ Top rated (Farmer & Owner can view)
router.get("/top-rated", authMiddleware, equipmentController.getTopRatedEquipment);

// ➕ Add new equipment (Owner only, with image upload)
router.post(
  "/add",
  authMiddleware,
  requireRole("owner"),
  upload.single("image"),   // 👈 Multer still handles file
  equipmentController.addEquipment
);


// 📦 Seed sample data (Owner only)
router.post("/seed", authMiddleware, requireRole("owner"), equipmentController.seedEquipment);

// all 
router.get("/all", equipmentController.getAllEquipment);


router.get("/category/:category", equipmentController.getEquipmentByCategory);

// 🗂 Get logged-in owner's listed equipment
router.get(
  "/my-listed",
  authMiddleware,
  requireRole("owner"),
  equipmentController.getMyListedEquipments
);

// ❌ Delete equipment by ID (Owner only)
router.delete(
  "/delete/:id",
  authMiddleware,
  requireRole("owner"),
  equipmentController.deleteEquipment
);
// ✏️ Update equipment (Owner only, with optional image upload)
router.put(
  "/update/:id",
  authMiddleware,
  requireRole("owner"),
  upload.single("image"),   // ⬅ allows sending new image (optional)
  equipmentController.updateEquipment
);

// 🌍 filter city
router.get("/city/:city", async (req, res) => {
  try {
    const city = req.params.city.trim();

    const equipments = await Equipment.find({
      location: { $regex: new RegExp(city, "i") }  // Case-insensitive match
    });

    res.status(200).json(equipments);
  } catch (error) {
    console.error("City API Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


module.exports = router;
