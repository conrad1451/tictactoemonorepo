// backend/src/index.ts

// CHQ: Gemini AI generated file
import express, { Express } from 'express';
import cors from 'cors'; 
import { connectToDatabase } from './db.js';
import { isOriginAllowed } from './cors.js';
import authRoutes from './routes/auth.js';
import scoreRoutes from './routes/scores.js';
import meRoutes from './routes/me.js';
import healthRoutes from './routes/health.js';

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

// CHQ: API Documentation Endpoint
app.get('/', (req, res) => {
  res.json({
    name: "Tic Tac Toe API",
    description: "A multiplayer tic tac toe game backend",
    version: "1.0.0",
    endpoints: [
      {
        path: "/api/health",
        method: "GET",
        description: "Check if the database is reachable",
        auth: false
      },
      {
        path: "/api/leaderboard",
        method: "GET",
        description: "Fetch the top scores by board size",
        auth: false,
        queryParams: ["boardSize"]
      },
      {
        path: "/api/me",
        method: "GET",
        description: "Get the current user's profile",
        auth: true
      },
      {
        path: "/api/scores",
        method: "POST",
        description: "Submit a game result",
        auth: true
      }
    ],
    liveUrl: "https://tictactoebronodeapi.netlify.app",
    githubUrl: "https://github.com/yourname/repo"
  });
});

// CHQ: Gemini AI: Mount at root
app.use('/auth', authRoutes);
app.use('/', healthRoutes);
app.use('/', scoreRoutes);
app.use('/', meRoutes);

export default app;
