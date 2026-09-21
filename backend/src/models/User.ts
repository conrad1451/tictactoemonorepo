// backend/src/models/User.ts

// CHQ: Gemini AI generated file

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string; // Using your existing userId string (e.g. Descope/Auth ID)
  name?: string;
  email?: string;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, default: null },
    email: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);