// backend/src/routes/scores.ts

import { Router } from "express";
import { User } from "../models/User.js";
import { Score } from "../models/Score.js";
import { AuthenticatedRequest, verifyToken } from "../middleware/auth.js";

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

    // Upsert User record (equivalent to ON DUPLICATE KEY UPDATE)
    await User.findByIdAndUpdate(
      userId,
      {
        name: req.user?.name ?? null,
        email: req.user?.email ?? null,
      },
      { upsert: true, new: true }
    );

    // Save Score entry
    await Score.create({
      userId,
      result,
      timeSeconds,
      boardSize,
    });

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

    // Run aggregation matching MySQL COUNT, MIN, AVG metrics
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
      return res.json({
        userId,
        bestTime: null,
        totalGames: 0,
        averageTime: null,
      });
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

    // Aggregate winning scores, group per user for best time, and populate user display names
    const leaderboard = await Score.aggregate([
      {
        $match: {
          boardSize,
          result: "win",
        },
      },
      {
        $group: {
          _id: "$userId",
          bestTime: { $min: "$timeSeconds" },
          totalGames: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      {
        $unwind: {
          path: "$userDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: {
            $ifNull: ["$userDoc.name", "$userDoc.email", "Anonymous"],
          },
          bestTime: 1,
          totalGames: 1,
        },
      },
      { $sort: { bestTime: 1 } },
      { $limit: 10 },
    ]);

    return res.json(leaderboard);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;