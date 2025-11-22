const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
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

router.post(
  "/add",
  upload.single("image"),
  (req, res, next) => {
    console.log("🧪 Multer File Received:", req.file);
    next();
  },
  equipmentController.addEquipment
);

// 📦 Seed sample data (Owner only)
router.post("/seed", authMiddleware, requireRole("owner"), equipmentController.seedEquipment);

module.exports = router;
