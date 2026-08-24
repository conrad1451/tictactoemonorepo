// backend/src/routes/scores.ts

// CHQ: Claude AI (Haiku) created and modified with Gemini AI

import { Router } from "express";
// import { pool } from "../db.ts";
import { pool } from "../db.js";
// import { AuthenticatedRequest, verifyToken } from "../middleware/auth";
import { AuthenticatedRequest, verifyToken } from "../middleware/auth.js";
// import { AuthenticatedRequest, verifyToken } from "../middleware/auth.ts";

// CHQ: Gemini AI: Explicit type annotation
const router: Router = Router();

// In-memory storage (replace with database in production)
const scores: Map<
  string,
  Array<{ timeSeconds: number; createdAt: Date }>
> = new Map();
const users: Map<string, { email: string; name: string }> = new Map();

// Save a score (requires authentication)
router.post("/scores", async (req: AuthenticatedRequest, res) => {
  // router.post("/scores", verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, timeSeconds } = req.body;
    // const userId = req.user!.userId;

    await pool.query(
      "INSERT INTO scores (user_id, time_seconds, created_at) VALUES (?, ?, NOW())",
      [userId, timeSeconds],
    );
    res.json({ message: "Score saved" });

    if (!timeSeconds || timeSeconds <= 0) {
      return res.status(400).json({ error: "Invalid time" });
    }

    // Store user info
    if (!users.has(userId)) {
      users.set(userId, {
        email: req.user!.email,
        name: req.user!.name,
      });
    }

    // Store score
    if (!scores.has(userId)) {
      scores.set(userId, []);
    }

    const userScores = scores.get(userId)!;
    userScores.push({
      timeSeconds,
      createdAt: new Date(),
    });

    // Keep only best 100 scores
    userScores.sort((a, b) => a.timeSeconds - b.timeSeconds);
    if (userScores.length > 100) {
      userScores.pop();
    }

    res.json({
      message: "Score saved",
      timeSeconds,
      rank: userScores.findIndex((s) => s.timeSeconds === timeSeconds) + 1,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to save score" });
  }
});

// Get user stats
router.get("/scores/user/:userId", (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const userScores = scores.get(userId) || [];
    const user = users.get(userId);

    if (userScores.length === 0) {
      return res.json({
        userId,
        username: user?.name || "Anonymous",
        bestTime: null,
        totalGames: 0,
        averageTime: null,
      });
    }

    const bestTime = userScores.length
      ? Math.min(...userScores.map((s) => s.timeSeconds))
      : 0;
    const averageTime = userScores.length
      ? userScores.reduce((sum, s) => sum + s.timeSeconds, 0) /
        userScores.length
      : 0;
    res.json({
      userId,
      username: user?.name || "Anonymous",
      bestTime,
      totalGames: userScores.length,
      averageTime: Math.round(averageTime * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

// Get leaderboard
router.get("/leaderboard", (req, res) => {
  try {
    const leaderboard = Array.from(scores.entries())
      .filter(([_, userScores]) => userScores.length > 0) // Guard against empty user arrays
      .map(([userId, userScores]) => {
        const bestTime = Math.min(...userScores.map((s) => s.timeSeconds));
        const user = users.get(userId);
        return {
          userId,
          username: user?.name || "Anonymous",
          bestTime,
          totalGames: userScores.length,
        };
      })
      .sort((a, b) => a.bestTime - b.bestTime)
      .slice(0, 10);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
