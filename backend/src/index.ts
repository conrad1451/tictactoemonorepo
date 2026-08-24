// backend/src/index.ts

// CHQ: Claude AI (Haiku) generated file

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import scoresRouter from "./routes/scores";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRouter);
app.use("/api", scoresRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
