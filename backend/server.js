// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import diaryRoutes from "./routes/diaryRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/diary", diaryRoutes);
app.use("/api/auth", authRoutes);

// DB + Server
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("✅ MongoDB connected");
        app.listen(5000, () => console.log("🚀 Server running on port 5000"));
    })
    .catch((err) => console.error("❌ MongoDB connection error:", err));
