const jwt = require("jsonwebtoken");
const User = require("../models/User");
const express = require("express");
const app = express();

app.use(express.json()); // ✅ important


// Basic auth (any logged-in user)
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) return res.status(401).json({ error: "Invalid user" });

    next();
  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Role-based middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.userType !== role) {
      return res.status(403).json({ error: `Access denied: ${role} only` });
    }

    next();
  };
};

module.exports = { authMiddleware, requireRole };
