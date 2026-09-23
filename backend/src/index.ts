// backend/src/index.ts

// CHQ: Gemini AI generated file
import express from 'express';
import cors from 'cors'; 
import { connectToDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import scoreRoutes from './routes/scores.js';

// 2. Configure CORS middleware to accept requests from your Vercel frontend
const app = express();

app.use(
  cors({
    origin: 'https://tictactoebro.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.options('*', cors());
app.use(express.json());

// CHQ: Claude AI (Sonnet): fix Netlify function path prefix
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  next();
});

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
app.use('/', scoreRoutes);

export default app;