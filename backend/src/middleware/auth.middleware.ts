import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    organizationId: string;
    role: string;
  };
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      organizationId: string;
      role: string;
    };

    req.user = decoded;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
