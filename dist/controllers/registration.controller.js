"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistration = createRegistration;
const zod_1 = require("zod");
const http_error_js_1 = require("../lib/http-error.js");
const paystack_js_1 = require("../lib/paystack.js");
const payment_model_js_1 = require("../models/payment.model.js");
const registration_model_js_1 = require("../models/registration.model.js");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const settings_model_js_1 = require("../models/settings.model.js");
const registrationSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2).max(160),
    email: zod_1.z.string().trim().email().max(255),
    phone: zod_1.z.string().trim().min(6).max(32),
    location: zod_1.z.enum(["LAGOS", "AWKA"]),
    categoryId: zod_1.z.coerce.number().int().positive(),
    bio: zod_1.z.string().trim().min(20).max(3000),
});
async function createRegistration(request, response, next) {
    let saved = false;
    try {
        if (!(await settings_model_js_1.settingsModel.getRegistrationEnabled())) {
            throw new http_error_js_1.HttpError(403, "Audition registration is currently closed.");
        }
        const input = registrationSchema.parse(request.body);
        const registration = await registration_model_js_1.registrationModel.create({
            ...input,
            imagePath: request.file?.filename,
        });
        saved = true;
        const amountKobo = Number(process.env.AUDITION_REGISTRATION_FEE_KOBO ?? 500000);
        if (!Number.isSafeInteger(amountKobo) || amountKobo < 1) {
            throw new http_error_js_1.HttpError(503, "The registration fee is not configured correctly.");
        }
        const reference = (0, node_crypto_1.randomUUID)();
        await payment_model_js_1.paymentModel.createPending({
            reference,
            registrationId: registration.id,
            email: input.email,
            amountKobo,
        });
        try {
            const checkout = await (0, paystack_js_1.initializePaystackTransaction)({
                email: input.email,
                amountKobo,
                reference,
                registrationId: registration.id,
                eventTitle: "Zam audition registration",
            });
            response.status(201).json({
                data: {
                    registration,
                    payment: {
                        authorizationUrl: checkout.authorization_url,
                        reference,
                        amountKobo,
                    },
                },
                message: "Registration saved. Complete payment to finish your audition entry.",
            });
        }
        catch (error) {
            await payment_model_js_1.paymentModel.markFailed(reference);
            throw error;
        }
    }
    catch (error) {
        if (!saved && request.file)
            await (0, promises_1.unlink)(request.file.path).catch(() => { });
        next(error);
    }
}
//# sourceMappingURL=registration.controller.js.map