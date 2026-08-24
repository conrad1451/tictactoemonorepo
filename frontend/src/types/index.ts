// frontend/src/types/index.ts

// CHQ: Claude AI (Haiku) generated file

export type CellValue = "X" | "O" | null;
export type Board = CellValue[];

export interface GameState {
  board: Board;
  isXNext: boolean;
  winner: CellValue | "Draw" | null;
  moveCount: number;
}

export interface UserStats {
  userId: string;
  username: string;
  bestTime: number | null;
  totalGames: number;
  averageTime: number | null;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  bestTime: number;
  totalGames: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  sessionJwt: string;
}
