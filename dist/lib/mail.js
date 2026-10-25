"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailer = void 0;
exports.escapeHtml = escapeHtml;
exports.textToHtml = textToHtml;
exports.sendEmail = sendEmail;
exports.buildWelcomeEmail = buildWelcomeEmail;
exports.buildReplyEmail = buildReplyEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const http_error_js_1 = require("./http-error.js");
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
exports.mailer = smtpHost && smtpUser && smtpPass
    ? nodemailer_1.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
    })
    : null;
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
// Escapes user/admin-written text and keeps its line breaks.
function textToHtml(value) {
    return escapeHtml(value).replace(/\r?\n/g, "<br />");
}
async function sendEmail(payload) {
    if (!exports.mailer) {
        throw new http_error_js_1.HttpError(503, "Email delivery is not configured. Add SMTP credentials to enable notifications.");
    }
    const from = process.env.MAIL_FROM ??
        process.env.SMTP_FROM ??
        `Zam Models & Signatures <${smtpUser ?? "noreply@zammodels.com"}>`;
    await exports.mailer.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? payload.html.replace(/<[^>]+>/g, " "),
    });
    return true;
}
function buildWelcomeEmail(input) {
    const name = escapeHtml(input.fullName || "Talent");
    return {
        subject: "Welcome to Zam Models & Signatures",
        html: `
      <div style="font-family: Arial, sans-serif; background: #f5f1ea; padding: 32px; color: #1b1b1a;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd3; border-radius: 12px; overflow: hidden;">
          <div style="background: #111111; color: #f5f1ea; padding: 24px 28px;">
            <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #d8bf82;">Zam Models & Signatures</div>
            <h2 style="margin: 10px 0 0; font-size: 30px;">Welcome, ${name}</h2>
          </div>
          <div style="padding: 28px; line-height: 1.7; font-size: 16px;">
            <p>Thank you for registering for the <strong>${escapeHtml(input.categoryName)}</strong> category with Zam Models & Signatures.</p>
            <p>Your application has been received and is currently under review by our team. We will be in touch with the next steps, updates, and important dates soon.</p>
            <p>In the meantime, keep your portfolio ready, take care of your photos, and watch your inbox for any follow-up communication from us.</p>
            <p style="margin-top: 24px;">
              Warm regards,<br />
              <strong>The Zam Models & Signatures Team</strong>
            </p>
          </div>
        </div>
      </div>
    `,
        text: `Hello ${input.fullName || "Talent"}, thank you for registering for ${input.categoryName}. Your application has been received and is currently under review. We will contact you with the next steps soon. Warm regards, Zam Models & Signatures.`,
    };
}
function buildReplyEmail(input) {
    return {
        subject: input.subject,
        html: `
      <div style="font-family: Arial, sans-serif; background: #f5f1ea; padding: 32px; color: #1b1b1a;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd3; border-radius: 12px; padding: 28px;">
          <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8b6d2d;">Zam Models & Signatures</div>
          <h2 style="margin: 10px 0 18px; font-size: 28px;">Hi ${escapeHtml(input.recipientName)},</h2>
          <div style="line-height: 1.8; font-size: 16px;">${textToHtml(input.message)}</div>
          <p style="margin-top: 24px;">Warm regards,<br /><strong>The Zam Models & Signatures Team</strong></p>
        </div>
      </div>
    `,
        text: `Hi ${input.recipientName},\n\n${input.message}\n\nWarm regards,\nZam Models & Signatures`,
    };
}
//# sourceMappingURL=mail.js.map