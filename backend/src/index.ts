// backend/src/index.ts

// CHQ: Gemini AI generated file
import express, { Express } from 'express';
import cors from 'cors'; 
import { connectToDatabase } from './db.js';
import { isOriginAllowed } from './cors.js';
import authRoutes from './routes/auth.js';
import scoreRoutes from './routes/scores.js';
import meRoutes from './routes/me.js';

// CHQ: Claude AI (Sonnet) explicitly annotated app's type
const app: Express = express(); 

// CHQ: Claude AI: Allowed origins: see cors.ts (FRONTEND_URL, 
//      FRONTEND_URL_2, localhost dev ports, GitHub Codespaces)
app.use(
  cors({
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // no `credentials: true`: Bearer tokens in the Authorization header don't need it
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
app.use('/', meRoutes);

export default app;
