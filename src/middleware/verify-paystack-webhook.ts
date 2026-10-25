import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.js";

export function verifyPaystackWebhook(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.header("x-paystack-signature");
  if (!secretKey)
    return next(new HttpError(503, "Payments are not configured yet."));
  if (!signature || !Buffer.isBuffer(request.body))
    return next(new HttpError(401, "Invalid payment signature."));

  const expected = createHmac("sha512", secretKey)
    .update(request.body)
    .digest();
  const received = Buffer.from(signature, "hex");
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return next(new HttpError(401, "Invalid payment signature."));
  }
  next();
}
