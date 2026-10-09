// backend/src/utils/leaderboardPipeline.ts
// The leaderboard is public, so it only ever exposes the chosen username (never name or email).

import type { PipelineStage } from "mongoose";

export const buildLeaderboardPipeline = (boardSize: number): PipelineStage[] => [
  { $match: { boardSize, result: "win" } },
  { $group: { _id: "$userId", bestTime: { $min: "$timeSeconds" }, totalGames: { $sum: 1 } } },
  { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userDoc" } },
  { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      userId: "$_id",
      username: { $ifNull: ["$userDoc.username", "Anonymous"] },
      bestTime: 1,
      totalGames: 1,
    },
  },
  { $sort: { bestTime: 1 } },
  { $limit: 10 },
];
