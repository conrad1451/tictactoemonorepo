// backend/src/routes/auth.ts

// CHQ: Claude AI (Haiku) generated file

import { Router } from "express";

const router = Router();

// Exchange Descope auth code for session
router.post("/auth/verify", (req, res) => {
  try {
    const { sessionJwt } = req.body;

    if (!sessionJwt) {
      return res.status(400).json({ error: "No session token provided" });
    }

    // Token validation is handled by middleware
    res.json({ message: "Session verified" });
  } catch (error) {
    res.status(500).json({ error: "Auth verification failed" });
  }
});

export default router;
