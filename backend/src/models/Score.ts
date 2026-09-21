// backend/src/models/Score.ts

// CHQ: Gemini AI generated file

import mongoose, { Schema, Document } from 'mongoose';

export interface IScore extends Document {
  userId: string;
  result: 'win' | 'loss' | 'draw';
  timeSeconds: number;
  boardSize: number;
}

const ScoreSchema = new Schema<IScore>(
  {
    userId: { type: String, required: true, ref: 'User', index: true },
    result: { type: String, enum: ['win', 'loss', 'draw'], required: true },
    timeSeconds: { type: Number, required: true },
    boardSize: { type: Number, required: true, default: 3 },
  },
  { timestamps: true }
);

// Compound index to optimize leaderboard aggregation
ScoreSchema.index({ boardSize: 1, result: 1, timeSeconds: 1 });

export const Score = mongoose.model<IScore>('Score', ScoreSchema);