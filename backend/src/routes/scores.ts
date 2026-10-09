// backend/src/routes/scores.ts

import { Router } from "express";
import { User } from "../models/User.js";
import { Score } from "../models/Score.js";
import { AuthenticatedRequest, verifyToken } from "../middleware/auth.js";
import { buildLeaderboardPipeline } from "../utils/leaderboardPipeline.js";
import { pickProfile } from "../utils/profile.js";

interface GameResultRequestBody {
  result: "win" | "loss" | "draw";
  timeSeconds: number;
  boardSize?: number;
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

    // Keep name/email up to date, but never overwrite stored values with blanks.
    const profile = pickProfile(req.user);
    if (Object.keys(profile).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: profile }, { upsert: true });
    }

    await Score.create({ userId, result, timeSeconds, boardSize });

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

    const stats = await Score.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$userId",
          totalGames: { $sum: 1 },
          bestTime: { $min: "$timeSeconds" },
          averageTime: { $avg: "$timeSeconds" },
        },
      },
    ]);

    if (!stats || stats.length === 0) {
      return res.json({ userId, bestTime: null, totalGames: 0, averageTime: null });
    }

    const userStats = stats[0];

    return res.json({
      userId,
      bestTime: userStats.bestTime,
      totalGames: userStats.totalGames,
      averageTime: Math.round(Number(userStats.averageTime) * 100) / 100,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch scores" });
  }
});

// Get leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const boardSize = parseInt(req.query.boardSize as string, 10) || 3;
    return res.json(await Score.aggregate(buildLeaderboardPipeline(boardSize)));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
