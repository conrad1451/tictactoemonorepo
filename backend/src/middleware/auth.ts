// backend/src/middleware/auth.ts

// CHQ: Claude AI (Haiku) generated file

import { Request, Response, NextFunction } from "express";

interface DescopeClaims {
  sub?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

interface DescopeAuthResponse {
  valid: boolean;
  claims?: DescopeClaims;
}

function isAuthResponse(obj: unknown): obj is DescopeAuthResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "valid" in obj &&
    typeof (obj as Record<string, unknown>).valid === "boolean"
  );
}

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

    const response = await fetch(`${DESCOPE_API_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DESCOPE_PROJECT_ID}`,
      },
      body: JSON.stringify({ sessionJwt: token }),
    });

    const data: unknown = await response.json();

    if (isAuthResponse(data) && data.valid) {
      const claims = data.claims ?? {};

      req.user = {
        userId: claims.sub || "sadasildj",
        email: claims.email || "blank@gmail.com",
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
