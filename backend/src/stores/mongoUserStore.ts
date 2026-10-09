// backend/src/stores/mongoUserStore.ts

import { User } from "../models/User.js";
import { isDuplicateKeyError } from "../utils/mongoErrors.js";
import type { Profile } from "../utils/profile.js";
import type { UserProfileStore } from "../routes/meRouter.js";

export const mongoUserStore: UserProfileStore = {
  async getUsername(userId) {
    const doc = await User.findById(userId, { username: 1 }).lean<{ username?: string }>();
    return doc?.username ?? null;
  },

  async setUsername(userId: string, username: string, profile: Profile) {
    const $set: Record<string, string> = {
      ...profile,
      username,
      usernameLower: username.toLowerCase(),
    };
    try {
      await User.findByIdAndUpdate(userId, { $set }, { upsert: true });
      return "ok";
    } catch (err) {
      if (isDuplicateKeyError(err, "usernameLower")) return "taken";
      throw err;
    }
  },
};
