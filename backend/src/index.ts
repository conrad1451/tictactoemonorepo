// backend/src/index.ts

// CHQ: Gemini AI generated file
import express, { Express } from 'express';
import cors from 'cors'; 
import { connectToDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import scoreRoutes from './routes/scores.js';

// 2. Configure CORS middleware to accept requests from your Vercel frontend
// CHQ: Claude AI (Sonnet) explicitly annotated app's type
const app: Express = express(); 

// CHQ: Claude AI: CORS: allow FRONTEND_URL plus local Vite dev ports 5173–5178
const allowedOrigins: string[] = [
  process.env.FRONTEND_URL?.replace(/\/$/, ''),
  ...[5173, 5174, 5175, 5176, 5177, 5178].map((p) => `http://localhost:${p}`),
].filter((o): o is string => Boolean(o));

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header = curl/server-to-server, not a browser CORS request
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false); // CHQ: Claude AI: omit CORS headers; browser blocks it
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

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
