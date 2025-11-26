const express = require("express");
const app = express();
const cors = require('cors');
app.use(cors());
const mongoose = require("mongoose");
const dotenv = require("dotenv");
// const cors = require("cors");

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB HIIIIIIII connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use('/api/equipment', equipmentRoutes); // Equipment routes

app._router.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(r.route.path, r.route.methods);
  }
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`🚀 Server running on port DEMO PORT ${PORT}`));
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api', reviewRoutes);