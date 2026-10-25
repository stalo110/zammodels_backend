import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { inquiryModel } from "../models/inquiry.model.js";

const inquirySchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(32).optional(),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(5000),
});

export async function createInquiry(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const inquiryInput = inquirySchema.parse(request.body) as {
      fullName: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
    };

    const inquiry = await inquiryModel.create(inquiryInput);
    response
      .status(201)
      .json({ data: inquiry, message: "Your message has been sent." });
  } catch (error) {
    next(error);
  }
}
