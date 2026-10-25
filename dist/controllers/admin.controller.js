"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = loginAdmin;
exports.getDashboardStats = getDashboardStats;
exports.getParticipants = getParticipants;
exports.updateParticipantStatus = updateParticipantStatus;
exports.getInquiries = getInquiries;
exports.replyToInquiry = replyToInquiry;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.sendBroadcastEmail = sendBroadcastEmail;
const zod_1 = require("zod");
const http_error_js_1 = require("../lib/http-error.js");
const admin_auth_js_1 = require("../middleware/admin-auth.js");
const inquiry_model_js_1 = require("../models/inquiry.model.js");
const registration_model_js_1 = require("../models/registration.model.js");
const settings_model_js_1 = require("../models/settings.model.js");
const mail_js_1 = require("../lib/mail.js");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email().max(255),
    password: zod_1.z.string().min(6).max(200),
});
const pageSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(12),
    search: zod_1.z.string().trim().optional(),
    status: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    categoryId: zod_1.z.coerce.number().int().positive().optional(),
});
async function loginAdmin(request, response, next) {
    try {
        const input = loginSchema.parse(request.body);
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) {
            throw new http_error_js_1.HttpError(503, "Admin credentials are not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in the API environment.");
        }
        if (input.email.toLowerCase() !== adminEmail ||
            input.password !== adminPassword) {
            throw new http_error_js_1.HttpError(401, "Invalid admin credentials.");
        }
        const token = (0, admin_auth_js_1.signAdminToken)(adminEmail);
        response.status(200).json({
            data: {
                token,
                user: { email: adminEmail, role: "admin" },
            },
            message: "Admin login successful.",
        });
    }
    catch (error) {
        next(error);
    }
}
async function getDashboardStats(_request, response, next) {
    try {
        const [totalParticipants, pending, approved, rejected, totalInquiries, unreadInquiries, registrationEnabled,] = await Promise.all([
            registration_model_js_1.registrationModel.count(),
            registration_model_js_1.registrationModel.count({ status: "PENDING" }),
            registration_model_js_1.registrationModel.count({ status: "APPROVED" }),
            registration_model_js_1.registrationModel.count({ status: "REJECTED" }),
            inquiry_model_js_1.inquiryModel.count({}),
            inquiry_model_js_1.inquiryModel.count({ status: "UNREAD" }),
            settings_model_js_1.settingsModel.getRegistrationEnabled(),
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
    }
    catch (error) {
        next(error);
    }
}
async function getParticipants(request, response, next) {
    try {
        const query = pageSchema.parse(request.query);
        const results = await registration_model_js_1.registrationModel.list({
            search: query.search,
            status: query.status,
            location: query.location,
            categoryId: query.categoryId,
            skip: (query.page - 1) * query.pageSize,
            take: query.pageSize,
        });
        const total = await registration_model_js_1.registrationModel.count({
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
    }
    catch (error) {
        next(error);
    }
}
async function updateParticipantStatus(request, response, next) {
    try {
        const statusSchema = zod_1.z.object({
            status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED"]),
        });
        const participantId = zod_1.z.string().trim().min(1).parse(request.params.id);
        const { status } = statusSchema.parse(request.body);
        const participant = await registration_model_js_1.registrationModel.updateStatus(participantId, status);
        response.json({
            data: participant,
            message: "Participant status updated.",
        });
    }
    catch (error) {
        next(error);
    }
}
async function getInquiries(request, response, next) {
    try {
        const query = pageSchema.parse(request.query);
        const results = await inquiry_model_js_1.inquiryModel.list({
            search: query.search,
            status: query.status,
            skip: (query.page - 1) * query.pageSize,
            take: query.pageSize,
        });
        const total = await inquiry_model_js_1.inquiryModel.count({
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
    }
    catch (error) {
        next(error);
    }
}
async function replyToInquiry(request, response, next) {
    try {
        const replySchema = zod_1.z.object({
            subject: zod_1.z.string().trim().min(3).max(180),
            message: zod_1.z.string().trim().min(10).max(5000),
        });
        const inquiryId = zod_1.z.string().trim().min(1).parse(request.params.id);
        const inquiry = await inquiry_model_js_1.inquiryModel.findById(inquiryId);
        if (!inquiry) {
            throw new http_error_js_1.HttpError(404, "Inquiry was not found.");
        }
        const { subject, message } = replySchema.parse(request.body);
        const email = (0, mail_js_1.buildReplyEmail)({
            recipientName: inquiry.fullName,
            subject,
            message,
        });
        await (0, mail_js_1.sendEmail)({ to: inquiry.email, ...email });
        await inquiry_model_js_1.inquiryModel.updateStatus(inquiry.id, "RESPONDED");
        response.json({
            data: { id: inquiry.id },
            message: "Your reply has been sent successfully.",
        });
    }
    catch (error) {
        next(error);
    }
}
async function getSettings(_request, response, next) {
    try {
        const registrationEnabled = await settings_model_js_1.settingsModel.getRegistrationEnabled();
        response.json({
            data: { registrationEnabled },
        });
    }
    catch (error) {
        next(error);
    }
}
async function updateSettings(request, response, next) {
    try {
        const schema = zod_1.z.object({
            registrationEnabled: zod_1.z.boolean(),
        });
        const { registrationEnabled } = schema.parse(request.body);
        const setting = await settings_model_js_1.settingsModel.setRegistrationEnabled(registrationEnabled);
        response.json({
            data: { registrationEnabled: setting.value === "true" },
            message: "Registration settings updated.",
        });
    }
    catch (error) {
        next(error);
    }
}
async function sendBroadcastEmail(request, response, next) {
    try {
        const schema = zod_1.z.object({
            target: zod_1.z.enum(["all", "single"]),
            subject: zod_1.z.string().trim().min(3).max(180),
            message: zod_1.z.string().trim().min(10).max(5000),
            recipientEmail: zod_1.z.string().trim().email().max(255).optional(),
        });
        const input = schema.parse(request.body);
        const recipients = input.target === "single"
            ? [input.recipientEmail].filter(Boolean)
            : (await registration_model_js_1.registrationModel.findDistinctEmails()).map((item) => item.email);
        if (!recipients.length) {
            throw new http_error_js_1.HttpError(404, "No recipients were found for this email.");
        }
        for (const to of recipients) {
            await (0, mail_js_1.sendEmail)({
                to,
                subject: input.subject,
                html: `
          <div style="font-family: Arial, sans-serif; background: #f5f1ea; padding: 32px; color: #1b1b1a;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd3; border-radius: 12px; padding: 30px;">
              <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8b6d2d;">Zam Models & Signatures</div>
              <h2 style="margin: 12px 0 18px; font-size: 28px;">${(0, mail_js_1.escapeHtml)(input.subject)}</h2>
              <div style="line-height: 1.8; font-size: 16px;">${(0, mail_js_1.textToHtml)(input.message)}</div>
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
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=admin.controller.js.map