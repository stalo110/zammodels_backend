import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { signAdminToken } from "../middleware/admin-auth.js";
import { inquiryModel } from "../models/inquiry.model.js";
import { registrationModel } from "../models/registration.model.js";
import { settingsModel } from "../models/settings.model.js";
import {
  buildReplyEmail,
  escapeHtml,
  sendEmail,
  textToHtml,
} from "../lib/mail.js";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(200),
});

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export async function loginAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = loginSchema.parse(request.body);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new HttpError(
        503,
        "Admin credentials are not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in the API environment.",
      );
    }

    if (
      input.email.toLowerCase() !== adminEmail ||
      input.password !== adminPassword
    ) {
      throw new HttpError(401, "Invalid admin credentials.");
    }

    const token = signAdminToken(adminEmail);
    response.status(200).json({
      data: {
        token,
        user: { email: adminEmail, role: "admin" },
      },
      message: "Admin login successful.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const [
      totalParticipants,
      pending,
      approved,
      rejected,
      totalInquiries,
      unreadInquiries,
      registrationEnabled,
    ] = await Promise.all([
      registrationModel.count(),
      registrationModel.count({ status: "PENDING" }),
      registrationModel.count({ status: "APPROVED" }),
      registrationModel.count({ status: "REJECTED" }),
      inquiryModel.count({}),
      inquiryModel.count({ status: "UNREAD" }),
      settingsModel.getRegistrationEnabled(),
    ]);

    response.json({
      data: {
        stats: {
          totalParticipants,
          pending,
          approved,
          rejected,
          totalInquiries,
          unreadInquiries,
          registrationEnabled,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getParticipants(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const query = pageSchema.parse(request.query);
    const results = await registrationModel.list({
      search: query.search,
      status: query.status,
      location: query.location,
      categoryId: query.categoryId,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    const total = await registrationModel.count({
      search: query.search,
      status: query.status,
      location: query.location,
      categoryId: query.categoryId,
    });

    response.json({
      data: results,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateParticipantStatus(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const statusSchema = z.object({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    });
    const participantId = z.string().trim().min(1).parse(request.params.id);
    const { status } = statusSchema.parse(request.body);
    const participant = await registrationModel.updateStatus(
      participantId,
      status,
    );
    response.json({
      data: participant,
      message: "Participant status updated.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getInquiries(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const query = pageSchema.parse(request.query);
    const results = await inquiryModel.list({
      search: query.search,
      status: query.status,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    const total = await inquiryModel.count({
      search: query.search,
      status: query.status,
    });

    response.json({
      data: results,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function replyToInquiry(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const replySchema = z.object({
      subject: z.string().trim().min(3).max(180),
      message: z.string().trim().min(10).max(5000),
    });
    const inquiryId = z.string().trim().min(1).parse(request.params.id);
    const inquiry = await inquiryModel.findById(inquiryId);
    if (!inquiry) {
      throw new HttpError(404, "Inquiry was not found.");
    }
    const { subject, message } = replySchema.parse(request.body);
    const email = buildReplyEmail({
      recipientName: inquiry.fullName,
      subject,
      message,
    });
    await sendEmail({ to: inquiry.email, ...email });
    await inquiryModel.updateStatus(inquiry.id, "RESPONDED");
    response.json({
      data: { id: inquiry.id },
      message: "Your reply has been sent successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getSettings(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const registrationEnabled = await settingsModel.getRegistrationEnabled();
    response.json({
      data: { registrationEnabled },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      registrationEnabled: z.boolean(),
    });
    const { registrationEnabled } = schema.parse(request.body);
    const setting =
      await settingsModel.setRegistrationEnabled(registrationEnabled);
    response.json({
      data: { registrationEnabled: setting.value === "true" },
      message: "Registration settings updated.",
    });
  } catch (error) {
    next(error);
  }
}

export async function sendBroadcastEmail(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      target: z.enum(["all", "single"]),
      subject: z.string().trim().min(3).max(180),
      message: z.string().trim().min(10).max(5000),
      recipientEmail: z.string().trim().email().max(255).optional(),
    });
    const input = schema.parse(request.body);
    const recipients =
      input.target === "single"
        ? ([input.recipientEmail].filter(Boolean) as string[])
        : (await registrationModel.findDistinctEmails()).map(
            (item) => item.email,
          );

    if (!recipients.length) {
      throw new HttpError(404, "No recipients were found for this email.");
    }

    for (const to of recipients) {
      await sendEmail({
        to,
        subject: input.subject,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f5f1ea; padding: 32px; color: #1b1b1a;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd3; border-radius: 12px; padding: 30px;">
              <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8b6d2d;">Zam Models & Signatures</div>
              <h2 style="margin: 12px 0 18px; font-size: 28px;">${escapeHtml(input.subject)}</h2>
              <div style="line-height: 1.8; font-size: 16px;">${textToHtml(input.message)}</div>
              <p style="margin-top: 24px;">Warm regards,<br /><strong>The Zam Models & Signatures Team</strong></p>
            </div>
          </div>
        `,
        text: input.message,
      });
    }

    response.json({
      data: { sentTo: recipients.length },
      message: "Broadcast email sent successfully.",
    });
  } catch (error) {
    next(error);
  }
}
