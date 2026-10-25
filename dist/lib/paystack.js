"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePaystackTransaction = initializePaystackTransaction;
exports.verifyPaystackTransaction = verifyPaystackTransaction;
const http_error_js_1 = require("./http-error.js");
// Overridable only so the flow can be exercised against a local mock.
const PAYSTACK_API = process.env.PAYSTACK_API_URL || "https://api.paystack.co";
async function paystackRequest(path, init) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        throw new http_error_js_1.HttpError(503, "Payments are not configured yet.");
    }
    let response;
    try {
        response = await fetch(`${PAYSTACK_API}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": "application/json",
                ...init.headers,
            },
            signal: AbortSignal.timeout(10_000),
        });
    }
    catch {
        throw new http_error_js_1.HttpError(502, "The payment provider could not be reached. Please try again.");
    }
    const payload = (await response
        .json()
        .catch(() => null));
    if (!response.ok || !payload?.status) {
        throw new http_error_js_1.HttpError(502, "The payment provider could not complete the request.");
    }
    return payload.data;
}
function initializePaystackTransaction(input) {
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL ??
        `${process.env.WEB_ORIGIN ?? "https://zammodelsandsignatures.com"}/payment/verify`;
    return paystackRequest("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
            email: input.email,
            amount: input.amountKobo,
            currency: "NGN",
            reference: input.reference,
            callback_url: callbackUrl,
            metadata: {
                ...(input.eventId
                    ? { eventId: input.eventId, eventTitle: input.eventTitle }
                    : {}),
                ...(input.registrationId
                    ? { registrationId: input.registrationId }
                    : {}),
            },
        }),
    });
}
function verifyPaystackTransaction(reference) {
    return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
}
//# sourceMappingURL=paystack.js.map