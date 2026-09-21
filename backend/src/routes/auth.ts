// backend/src/routes/auth.ts

// CHQ: refactored by Gemini AI 

import { Router, Request, Response } from "express";

// 1. Declare and initialize the router instance
const router = Router();
// const router: Router = Router();

interface VerifyAuthRequestBody {
  sessionJwt?: string;
}

// 2. Attach routes to the router instance
router.post("/verify", (req: Request<{}, {}, VerifyAuthRequestBody>, res: Response) => {
  try {
    const { sessionJwt } = req.body;

    if (!sessionJwt) {
      return res.status(400).json({ error: "No session token provided" });
    }

    return res.status(200).json({ message: "Session verified" });
  } catch (error) {
    return res.status(500).json({ error: "Auth verification failed" });
  }
});

// 3. Export router as default
export default router;