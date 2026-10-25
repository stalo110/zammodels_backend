"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePayment = initializePayment;
exports.verifyPayment = verifyPayment;
exports.receivePaystackWebhook = receivePaystackWebhook;
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const http_error_js_1 = require("../lib/http-error.js");
const paystack_js_1 = require("../lib/paystack.js");
const event_model_js_1 = require("../models/event.model.js");
const payment_model_js_1 = require("../models/payment.model.js");
const registration_model_js_1 = require("../models/registration.model.js");
const initializeSchema = zod_1.z
    .object({
    eventId: zod_1.z.coerce.number().int().positive().optional(),
    registrationId: zod_1.z.string().trim().min(8).max(30).optional(),
    email: zod_1.z.string().trim().email().max(255),
})
    .refine((input) => Boolean(input.eventId) !== Boolean(input.registrationId), {
    message: "Provide either an event or audition registration.",
});
const referenceSchema = zod_1.z.object({
    reference: zod_1.z.string().trim().min(8).max(100),
});
async function verifyAndRecord(reference) {
    const payment = await payment_model_js_1.paymentModel.findByReference(reference);
    if (!payment)
        throw new http_error_js_1.HttpError(404, "Payment reference was not found.");
    if (payment.status === "SUCCESS")
        return payment;
    const transaction = await (0, paystack_js_1.verifyPaystackTransaction)(reference);
    if (transaction.reference !== payment.reference ||
        transaction.amount !== payment.amountKobo ||
        transaction.currency !== payment.currency) {
        throw new http_error_js_1.HttpError(409, "The verified transaction does not match this payment.");
    }
    if (transaction.status === "success") {
        return payment_model_js_1.paymentModel.markSuccess(payment.reference, String(transaction.id));
    }
    if (transaction.status === "failed" || transaction.status === "abandoned") {
        await payment_model_js_1.paymentModel.markFailed(payment.reference);
        return { ...payment, status: "FAILED" };
    }
    return { ...payment, status: "PENDING" };
}
async function initializePayment(request, response, next) {
    let reference;
    try {
        const input = initializeSchema.parse(request.body);
        let eventTitle;
        let amountKobo;
        let paymentEmail = input.email;
        let eventId;
        let registrationId;
        if (input.registrationId) {
            const registration = await registration_model_js_1.registrationModel.findPaymentDetails(input.registrationId);
            if (!registration)
                throw new http_error_js_1.HttpError(404, "Audition registration was not found.");
            registrationId = registration.id;
            paymentEmail = registration.email;
            amountKobo = Number(process.env.AUDITION_REGISTRATION_FEE_KOBO ?? 500000);
            eventTitle = "Zam audition registration";
        }
        else {
            const event = await event_model_js_1.eventModel.findById(input.eventId);
            if (!event ||
                event.status !== "UPCOMING" ||
                event.eventDate <= new Date()) {
                throw new http_error_js_1.HttpError(404, "This event is not open for registration.");
            }
            if (!event.registrationFeeKobo || event.registrationFeeKobo < 1) {
                throw new http_error_js_1.HttpError(400, "Online payment is not enabled for this event.");
            }
            eventId = event.id;
            amountKobo = event.registrationFeeKobo;
            eventTitle = event.title;
        }
        if (!Number.isSafeInteger(amountKobo) || amountKobo < 1) {
            throw new http_error_js_1.HttpError(503, "The registration fee is not configured correctly.");
        }
        reference = (0, node_crypto_1.randomUUID)();
        await payment_model_js_1.paymentModel.createPending({
            reference,
            eventId,
            registrationId,
            email: paymentEmail,
            amountKobo,
        });
        try {
            const checkout = await (0, paystack_js_1.initializePaystackTransaction)({
                email: paymentEmail,
                amountKobo,
                reference,
                eventId,
                registrationId,
                eventTitle,
            });
            response
                .status(201)
                .json({
                data: { authorizationUrl: checkout.authorization_url, reference },
            });
        }
        catch (error) {
            await payment_model_js_1.paymentModel.markFailed(reference);
            throw error;
        }
    }
    catch (error) {
        next(error);
    }
}
async function verifyPayment(request, response, next) {
    try {
        const { reference } = referenceSchema.parse(request.body);
        const payment = await verifyAndRecord(reference);
        response.json({
            data: {
                reference: payment.reference,
                status: payment.status,
                amountKobo: payment.amountKobo,
                currency: payment.currency,
                paidAt: payment.paidAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function receivePaystackWebhook(request, response, next) {
    try {
        if (!Buffer.isBuffer(request.body))
            throw new http_error_js_1.HttpError(400, "Invalid webhook payload.");
        let payload;
        try {
            payload = JSON.parse(request.body.toString("utf8"));
        }
        catch {
            throw new http_error_js_1.HttpError(400, "Invalid webhook payload.");
        }
        const webhookSchema = zod_1.z.object({
            event: zod_1.z.string(),
            data: zod_1.z.object({ reference: zod_1.z.string().min(8).max(100) }),
        });
        const webhook = webhookSchema.parse(payload);
        if (webhook.event === "charge.success") {
            try {
                await verifyAndRecord(webhook.data.reference);
            }
            catch (error) {
                // References from other integrations on the same Paystack account
                // are acknowledged so Paystack does not keep retrying them.
                if (!(error instanceof http_error_js_1.HttpError && error.statusCode === 404))
                    throw error;
            }
        }
        response.status(200).json({ received: true });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=payment.controller.js.map