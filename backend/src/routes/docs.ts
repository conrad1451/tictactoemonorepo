// backend/src/routes/docs.ts

// CHQ: Claude AI (Haiku) generated file
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tic Tac Toe API</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 900px;
          width: 100%;
          padding: 40px;
        }
        
        h1 {
          color: #667eea;
          margin-bottom: 10px;
          font-size: 2.5em;
        }
        
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 1.1em;
        }
        
        .endpoints {
          display: grid;
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .endpoint {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.3s ease;
          border-left: 4px solid #667eea;
        }
        
        .endpoint:hover {
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
          transform: translateY(-2px);
        }
        
        .endpoint-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        
        .method {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.9em;
          color: white;
        }
        
        .method.get {
          background: #61affe;
        }
        
        .method.post {
          background: #49cc90;
        }
        
        .path {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 1.05em;
          color: #333;
          font-weight: 600;
        }
        
        .auth {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 3px;
          font-size: 0.85em;
          font-weight: 500;
        }
        
        .auth.required {
          background: #ffe0e0;
          color: #c41e3a;
        }
        
        .auth.public {
          background: #e0f0ff;
          color: #0066cc;
        }
        
        .description {
          color: #666;
          margin-top: 10px;
          line-height: 1.5;
        }
        
        .links {
          display: flex;
          gap: 20px;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #f0f0f0;
        }
        
        .link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .link-btn:hover {
          background: #764ba2;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 20px;
          }
          
          h1 {
            font-size: 2em;
          }
          
          .endpoint-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎮 Tic Tac Toe API</h1>
        <p class="subtitle">A multiplayer tic tac toe game backend</p>
        
        <div class="endpoints">
          <div class="endpoint">
            <div class="endpoint-header">
              <span class="method get">GET</span>
              <span class="path">/api/health</span>
              <span class="auth public">Public</span>
            </div>
            <p class="description">Check if the database is reachable and the API is healthy</p>
          </div>
          
          <div class="endpoint">
            <div class="endpoint-header">
              <span class="method get">GET</span>
              <span class="path">/api/leaderboard</span>
              <span class="auth public">Public</span>
            </div>
            <p class="description">Fetch the top scores by board size. Query param: <code>boardSize</code></p>
          </div>
          
          <div class="endpoint">
            <div class="endpoint-header">
              <span class="method get">GET</span>
              <span class="path">/api/me</span>
              <span class="auth required">Auth Required</span>
            </div>
            <p class="description">Get the current user's profile and statistics</p>
          </div>
          
          <div class="endpoint">
            <div class="endpoint-header">
              <span class="method post">POST</span>
              <span class="path">/api/scores</span>
              <span class="auth required">Auth Required</span>
            </div>
            <p class="description">Submit a completed game result to the leaderboard</p>
          </div>
        </div>
        
        <div class="links">
          <a href="https://github.com/conrad1451/tictactoemonorepo" class="link-btn">
            <span>📂</span> View on GitHub
          </a>
          <a href="https://conradhqportfolio.vercel.app" class="link-btn">
            <span>👤</span> My Portfolio
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
