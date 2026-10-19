// backend/src/routes/health.ts

import { Router } from "express";
import mongoose from "mongoose";

const router: Router = Router();

// Get health of backend service
router.get("/health", healthDBHandler);

// CHQ: Claude AI (Haiku) generated function
async function healthDBHandler(req: any, res: any): Promise<void> {
  try {
    // Ping the MongoDB database
    await mongoose.connection.db?.admin().ping();
    
    res.status(200).json({
      status: 'ok',
      database: 'reachable'
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      database: 'unreachable',
      error: err.message
    });
  }
}

export default router;
