import "./config/env.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import lectureRoutes from "./routes/lectureRoutes.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/groups", requireAuth, groupRoutes);
app.use("/api/lectures", requireAuth, lectureRoutes);
app.use((err, req, res, next) =>
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" }),
);

const port = process.env.PORT || 3000;
await mongoose.connect(process.env.MONGODB_URI);
app.listen(port, () =>
  console.log(`Lecture Notetaker API listening on ${port}`),
);
