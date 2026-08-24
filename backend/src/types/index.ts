// backend/src/types/index.ts

// CHQ: Claude AI (Haiku) generated file

export interface Score {
  id: string;
  userId: string;
  timeSeconds: number;
  createdAt: Date;
}

export interface UserScore {
  userId: string;
  username: string;
  bestTime: number;
  totalGames: number;
  averageTime: number;
}

export interface AuthToken {
  sub: string;
  email: string;
  name: string;
}
