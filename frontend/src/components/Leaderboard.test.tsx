// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Leaderboard } from "./Leaderboard";
import { LeaderboardEntry } from "../types";

const rows: LeaderboardEntry[] = [
  { userId: "1", username: "Ann", bestTime: 4, totalGames: 3 },
  { userId: "2", username: "Bob", bestTime: 9, totalGames: 7 },
];

const renderBoard = async (fetchLeaderboard: () => Promise<LeaderboardEntry[]>, size = 3, onSizeChange = vi.fn()) => {
  await act(async () => {
    render(<Leaderboard size={size} onSizeChange={onSizeChange} fetchLeaderboard={fetchLeaderboard} />);
  });
  return { onSizeChange };
};

describe("Leaderboard", () => {
  it("shows a loading message before data arrives", () => {
    render(<Leaderboard size={3} onSizeChange={() => {}} fetchLeaderboard={() => new Promise(() => {})} />);
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("renders ranked rows", async () => {
    await renderBoard(() => Promise.resolve(rows));
    expect(screen.getByText("#1 Ann — 4s (3 games)")).toBeTruthy();
    expect(screen.getByText("#2 Bob — 9s (7 games)")).toBeTruthy();
  });

  it("shows an empty state", async () => {
    await renderBoard(() => Promise.resolve([]));
    expect(screen.getByText("No scores recorded yet.")).toBeTruthy();
  });

  it("shows an error state when the request fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await renderBoard(() => Promise.reject(new Error("down")));
    expect(screen.getByText("Couldn't load the leaderboard.")).toBeTruthy();
    spy.mockRestore();
  });

  it("highlights the selected tab only", async () => {
    await renderBoard(() => Promise.resolve([]), 4);
    expect(screen.getByRole("button", { name: "4x4" }).className).toContain("btn-primary");
    expect(screen.getByRole("button", { name: "3x3" }).className).toContain("btn-secondary");
  });

  it("calls onSizeChange when a tab is clicked", async () => {
    const { onSizeChange } = await renderBoard(() => Promise.resolve([]));
    fireEvent.click(screen.getByRole("button", { name: "6x6" }));
    expect(onSizeChange).toHaveBeenCalledWith(6);
  });

  it("requests the scores for the selected size", async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    await renderBoard(fetcher, 7);
    expect(fetcher).toHaveBeenCalledWith(7);
  });
});
