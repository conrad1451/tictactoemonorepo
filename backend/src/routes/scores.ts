// backend/src/routes/scores.ts

// CHQ: Created with Claude AI (Haiku) and modified with Gemini AI

import { Router } from "express";
import { pool } from "../db.js";
import { AuthenticatedRequest, verifyToken } from "../middleware/auth.js";

// CHQ: Gemini AI added boardSize prop to GameResultRequestBody
interface GameResultRequestBody {
  result: "win" | "loss" | "draw";
  timeSeconds: number;
  boardSize?: number; // e.g., 3, 4, 5, 6, 7
}

const router: Router = Router();

// Save a score (requires authentication)
router.post("/scores", verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { result, timeSeconds, boardSize = 3 } = req.body as GameResultRequestBody;
    const userId = req.user?.userId;

    if (!userId || !result || timeSeconds === undefined) {
      return res.status(400).json({ error: "Missing required match details." });
    }

    await pool.query(
      `INSERT INTO users (id, name, email, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email)`,
      [userId, req.user?.name ?? null, req.user?.email ?? null],
    );

    await pool.query(
      "INSERT INTO scores (user_id, result, time_seconds, board_size, created_at) VALUES (?, ?, ?, ?, NOW())",
      [userId, result, timeSeconds, boardSize],
    );

    return res.status(200).json({
      message: "Game result recorded successfully",
      data: { userId, result, timeSeconds, boardSize },
    });
  } catch (error) {
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
// CHQ: Gemini AI added leaderboard filtering by boardSize
router.get("/leaderboard", async (req, res) => {
  try {
    const boardSize = parseInt(req.query.boardSize as string, 10) || 3;

    const [rows]: any = await pool.query(
      `SELECT
        s.user_id as userId,
        COALESCE(u.name, u.email, 'Anonymous') as username,
        MIN(s.time_seconds) as bestTime,
        COUNT(*) as totalGames
       FROM scores s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.board_size = ? AND s.result = 'win'
       GROUP BY s.user_id, u.name, u.email
       ORDER BY bestTime ASC
       LIMIT 10`,
      [boardSize],
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
export default router;
