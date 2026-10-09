// backend/src/models/User.ts

// CHQ: Gemini AI generated, edited with Claude AI (Sonnet)

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Omit<Document, '_id'> {
  _id: string; // Using your existing userId string (e.g. Descope/Auth ID)
  name?: string;
  email?: string;
  username?: string; // display name chosen by the player
  usernameLower?: string; // lowercase copy, used for case-insensitive uniqueness
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, default: null },
    email: { type: String, default: null },
    // No defaults: a missing field must stay missing, not become null, or the unique index
    // would treat every player without a username as a duplicate.
    username: { type: String },
    usernameLower: { type: String },
  },
  { timestamps: true }
);

// Unique only among documents that actually have a username.
UserSchema.index(
  { usernameLower: 1 },
  { unique: true, partialFilterExpression: { usernameLower: { $type: 'string' } } }
);

export const User = mongoose.model<IUser>('User', UserSchema);
