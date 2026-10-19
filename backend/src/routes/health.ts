// backend/src/routes/health.ts

import { Router } from "express";
const router: Router = Router();

// Get health of backend service
router.get("/health", healthDBHandler);

// CHQ: Claude AI (Haiku) generated function
async function healthDBHandler(req, res) {
  try {
    // Ping the MongoDB database
    await mongoose.connection.db.admin().ping();
    
    res.status(200).json({
      status: 'ok',
      database: 'reachable'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'unreachable',
      error: err.message
    });
  }
}


export default router;
