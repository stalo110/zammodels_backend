import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../lib/http-error.js";

export type AdminJwtPayload = {
  sub: string;
  email: string;
  role: "admin";
};

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new HttpError(503, "Admin sign-in is not configured.");
  }
  return "zam-dev-admin-secret";
}

export function signAdminToken(email: string) {
  return jwt.sign({ sub: "admin", email, role: "admin" }, jwtSecret(), {
    expiresIn: "8h",
  });
}

export function authenticateAdmin(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const header = request.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    next(new HttpError(401, "Authentication required."));
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret(), {
      algorithms: ["HS256"],
    }) as AdminJwtPayload;
    if (payload.role !== "admin") {
      throw new Error("Invalid admin payload");
    }
    request.admin = payload;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired session."));
  }
}
