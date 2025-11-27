const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { updateEquipment } = require("../controllers/equipmentController");
const upload = require("../middlewares/uploadMiddleware"); // Multer config

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


router.put("/update/:id", 
  authMiddleware, 
  upload.single("image"), 
  updateEquipment);
module.exports = router;
