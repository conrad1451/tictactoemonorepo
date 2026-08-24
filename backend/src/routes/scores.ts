// backend/src/routes/scores.ts

// CHQ: Claude AI (Haiku) created and modified with Gemini AI

import { Router } from "express";
import { pool } from "../db.js";
import { AuthenticatedRequest, verifyToken } from "../middleware/auth.js";

interface GameResultRequestBody {
  result: "win" | "loss" | "draw";
  timeSeconds: number;
}

const router: Router = Router();

// Save a score (requires authentication)
router.post("/scores", verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { result, timeSeconds } = req.body as GameResultRequestBody;
    const userId = req.user?.userId;

    if (!userId || !result || timeSeconds === undefined) {
      return res.status(400).json({ error: "Missing required match details." });
    }

    // Ensure a users row exists (and stays current) before inserting into
    // scores, since scores.user_id has a FOREIGN KEY constraint referencing
    // users.id. Descope-authenticated users are never separately written to
    // the users table anywhere else, so without this the insert below fails
    // with ER_NO_REFERENCED_ROW_2 on every single request.
    await pool.query(
      `INSERT INTO users (id, name, email, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email)`,
      [userId, req.user?.name ?? null, req.user?.email ?? null],
    );

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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

// Get leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT
        s.user_id as userId,
        COALESCE(u.name, u.email, 'Anonymous') as username,
        MIN(s.time_seconds) as bestTime,
        COUNT(*) as totalGames
       FROM scores s
       LEFT JOIN users u ON u.id = s.user_id
       GROUP BY s.user_id, u.name, u.email
       ORDER BY bestTime ASC
       LIMIT 10`,
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
