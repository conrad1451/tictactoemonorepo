// backend/src/middleware/auth.ts

// CHQ: Created by Claude AI (Haiku), edited using Gemini AI and Claude AI (Sonnet)

import { Request, Response, NextFunction } from "express";
import DescopeClient from "@descope/node-sdk";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
}

const DESCOPE_PROJECT_ID = process.env.DESCOPE_PROJECT_ID;

if (!DESCOPE_PROJECT_ID) {
  throw new Error("DESCOPE_PROJECT_ID environment variable is not set");
}

const descopeClient = DescopeClient({ projectId: DESCOPE_PROJECT_ID });

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

    const authInfo = await descopeClient.validateSession(token);
    const claims = authInfo.token as Record<string, unknown>;

    req.user = {
      userId: (claims.sub as string) ?? "",
      email: (claims.email as string) ?? "",
      name: (claims.name as string) ?? "User",
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
