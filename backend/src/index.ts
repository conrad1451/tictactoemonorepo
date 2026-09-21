// backend/src/index.ts

// CHQ: Gemini AI generated file
import express from 'express';
import { connectToDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import scoreRoutes from './routes/scores.js';

// Cannot use namespace 'Express' as a type.
// const app: Express = express();
const app = express();

app.use(express.json());

// DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// CHQ: Gemini AI: Mount at root
app.use('/auth', authRoutes);
app.use('/scores', scoreRoutes);

export default app;