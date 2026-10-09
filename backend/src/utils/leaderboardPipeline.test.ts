import { describe, it, expect } from "vitest";
import { buildLeaderboardPipeline } from "./leaderboardPipeline.js";

type Stage = Record<string, any>;
const stage = (pipeline: Stage[], key: string): Stage => pipeline.find((s) => key in s)![key];

describe("buildLeaderboardPipeline", () => {
  const pipeline = buildLeaderboardPipeline(5) as Stage[];

  it("only counts wins on the requested board size", () => {
    expect(stage(pipeline, "$match")).toEqual({ boardSize: 5, result: "win" });
  });

  it("shows the chosen username, falling back to Anonymous", () => {
    expect(stage(pipeline, "$project").username).toEqual({ $ifNull: ["$userDoc.username", "Anonymous"] });
  });

  it("never exposes a player's name or email (the leaderboard is public)", () => {
    const json = JSON.stringify(pipeline);
    expect(json).not.toContain("userDoc.email");
    expect(json).not.toContain("userDoc.name");
  });

  it("projects only the fields the frontend uses", () => {
    expect(Object.keys(stage(pipeline, "$project")).sort()).toEqual(
      ["_id", "bestTime", "totalGames", "userId", "username"].sort()
    );
  });

  it("ranks fastest first and returns the top 10", () => {
    expect(stage(pipeline, "$sort")).toEqual({ bestTime: 1 });
    expect(stage(pipeline, "$limit")).toBe(10);
  });

  it("keeps players whose user record is missing", () => {
    expect(stage(pipeline, "$unwind").preserveNullAndEmptyArrays).toBe(true);
  });
});
