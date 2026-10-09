// backend/src/routes/meRouter.ts
// Built from injected parts (store + auth middleware) so it can be tested without Mongo or Descope.

import { Router, RequestHandler } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validateUsername } from "../utils/username.js";
import { pickProfile, Profile } from "../utils/profile.js";

export interface UserProfileStore {
  getUsername(userId: string): Promise<string | null>;
  /** "taken" when another player already has this username (case-insensitive). */
  setUsername(userId: string, username: string, profile: Profile): Promise<"ok" | "taken">;
}

export const createMeRouter = ({ store, verify }: { store: UserProfileStore; verify: RequestHandler }): Router => {
  const router: Router = Router();

  router.get("/me", verify, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Not signed in" });
      return res.json({ userId, username: await store.getUsername(userId) });
    } catch {
      return res.status(500).json({ error: "Failed to load profile" });
    }
  });

  router.put("/me/username", verify, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Not signed in" });

      const check = validateUsername(req.body?.username);
      if (!check.ok) return res.status(400).json({ error: check.error });

      const outcome = await store.setUsername(userId, check.username, pickProfile(req.user));
      if (outcome === "taken") return res.status(409).json({ error: "That username is taken." });

      return res.json({ userId, username: check.username });
    } catch {
      return res.status(500).json({ error: "Failed to save username" });
    }
  });

  return router;
};
