// backend/src/middleware/auth.ts

// CHQ: Claude AI (Haiku) generated file

import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
}

const DESCOPE_PROJECT_ID = process.env.DESCOPE_PROJECT_ID;
const DESCOPE_API_URL = "https://api.descope.com";

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const response = await fetch.post(
      `${DESCOPE_API_URL}/verify`,
      { sessionJwt: token },
      {
        headers: {
          Authorization: `Bearer ${DESCOPE_PROJECT_ID}`,
        },
      },
    );

    if (response.data.valid) {
      const claims = response.data.claims;
      req.user = {
        userId: claims.sub,
        email: claims.email,
        name: claims.name || "User",
      };
      next();
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    res.status(401).json({ error: "Token verification failed" });
  }
};
