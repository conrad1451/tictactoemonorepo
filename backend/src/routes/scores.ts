// backend/src/routes/scores.ts

// CHQ: Claude AI (Haiku) created and modified with Gemini AI

import { Router } from "express";
// import { pool } from "../db.ts";
import { pool } from "../db.js";
// import { AuthenticatedRequest, verifyToken } from "../middleware/auth";
import { AuthenticatedRequest, verifyToken } from "../middleware/auth.js";
// import { AuthenticatedRequest, verifyToken } from "../middleware/auth.ts";

// CHQ: Gemini AI: Interface for match updates
interface GameResultRequestBody {
  result: "win" | "loss" | "draw";
  timeSeconds: number;
}

// CHQ: Gemini AI: Explicit type annotation
const router: Router = Router();

// In-memory storage (replace with database in production)
const scores: Map<
  string,
  Array<{ timeSeconds: number; createdAt: Date }>
> = new Map();
const users: Map<string, { email: string; name: string }> = new Map();

// CHQ: Gemini AI edited to query database
// Save a score (requires authentication)
router.post("/scores", verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { result, timeSeconds } = req.body as GameResultRequestBody;
    const userId = req.user?.userId;

    if (!userId || !result || timeSeconds === undefined) {
      return res.status(400).json({ error: "Missing required match details." });
    }

    // Insert game result into database using pool
    await pool.query(
      "INSERT INTO scores (user_id, result, time_seconds, created_at) VALUES (?, ?, ?, NOW())",
      [userId, result, timeSeconds],
    );
    return res.status(200).json({
      message: "Game result recorded successfully",
      data: { userId, result, timeSeconds },
    });
  } catch (error) {
    console.error("Error saving score:", error);
    return res.status(500).json({ error: "Failed to save game result" });
  }
});

// Get user stats
router.get("/scores/user/:userId", async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    // const userScores = scores.get(userId) || [];
    // const user = users.get(userId);

    // Query user metrics directly from database
    const [rows]: any = await pool.query(
      `SELECT 
        COUNT(*) as totalGames,
        MIN(time_seconds) as bestTime,
        AVG(time_seconds) as averageTime
       FROM scores 
       WHERE user_id = ?`,
      [userId],
    );

    const stats = rows[0];

    if (!stats || stats.totalGames === 0) {
      return res.json({
        userId,
        bestTime: null,
        totalGames: 0,
        averageTime: null,
      });
    }

    return res.json({
      userId,
      bestTime: stats.bestTime,
      totalGames: stats.totalGames,
      averageTime: Math.round(Number(stats.averageTime) * 100) / 100,
    });

    // if (userScores.length === 0) {
    //   return res.json({
    //     userId,
    //     username: user?.name || "Anonymous",
    //     bestTime: null,
    //     totalGames: 0,
    //     averageTime: null,
    //   });
    // }

    // const bestTime = userScores.length
    //   ? Math.min(...userScores.map((s) => s.timeSeconds))
    //   : 0;
    // const averageTime = userScores.length
    //   ? userScores.reduce((sum, s) => sum + s.timeSeconds, 0) /
    //     userScores.length
    //   : 0;
    // res.json({
    //   userId,
    //   username: user?.name || "Anonymous",
    //   bestTime,
    //   totalGames: userScores.length,
    //   averageTime: Math.round(averageTime * 100) / 100,
    // });
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
