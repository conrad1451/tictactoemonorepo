// backend/src/index.ts

// CHQ: Gemini AI generated file

import express from 'express';
import { connectToDatabase } from './db';
import authRoutes from './routes/auth';
import scoreRoutes from './routes/scores';

const app = express();

app.use(express.json());

// Middleware to ensure DB connection per request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.use('/.netlify/functions/api/auth', authRoutes);
app.use('/.netlify/functions/api/scores', scoreRoutes);

export default app;