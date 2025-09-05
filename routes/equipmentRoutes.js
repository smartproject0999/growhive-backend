const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const equipmentController = require("../controllers/equipmentController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// ---------------- Multer Setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // save files in uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
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
  upload.single("image"),   // ✅ Handle image upload
  equipmentController.addEquipment
);

// 📦 Seed sample data (Owner only)
router.post("/seed", authMiddleware, requireRole("owner"), equipmentController.seedEquipment);

module.exports = router;
