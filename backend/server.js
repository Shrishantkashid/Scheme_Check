require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const speechRoutes = require("./routes/speech");
const schemesRoutes = require("./routes/schemes");
const { startScheduler } = require("./scheduler");

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : "*";

// Middleware
// Set CORS_ORIGIN to your Expo/dev domains later, e.g.
// CORS_ORIGIN=https://your-frontend-domain.com,https://app.example.com
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend connected ✅🎉🎃");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/speech", speechRoutes);
app.use("/api/schemes", schemesRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    try {
      startScheduler();
    } catch (e) {
      console.error("Failed to start scheduler:", e);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
// Listen on 0.0.0.0 so AWS EC2 can accept traffic from outside the instance.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
