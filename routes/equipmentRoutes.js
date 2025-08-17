const express = require("express");
const router = express.Router();
const equipmentController = require("../controllers/equipmentController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// 🌍 Nearby equipment (Farmer & Owner can view)
router.get("/nearby", authMiddleware, equipmentController.getNearbyEquipment);

// ⭐ Top rated (Farmer & Owner can view)
router.get("/top-rated", authMiddleware, equipmentController.getTopRatedEquipment);

// ➕ Add new equipment (Owner only)
router.post("/add", authMiddleware, requireRole("owner"), equipmentController.addEquipment);

// 📦 Seed sample data (Owner only)
router.post("/seed", authMiddleware, requireRole("owner"), equipmentController.seedEquipment);

module.exports = router;

