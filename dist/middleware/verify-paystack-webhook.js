"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaystackWebhook = verifyPaystackWebhook;
const node_crypto_1 = require("node:crypto");
const http_error_js_1 = require("../lib/http-error.js");
function verifyPaystackWebhook(request, _response, next) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const signature = request.header("x-paystack-signature");
    if (!secretKey)
        return next(new http_error_js_1.HttpError(503, "Payments are not configured yet."));
    if (!signature || !Buffer.isBuffer(request.body))
        return next(new http_error_js_1.HttpError(401, "Invalid payment signature."));
    const expected = (0, node_crypto_1.createHmac)("sha512", secretKey)
        .update(request.body)
        .digest();
    const received = Buffer.from(signature, "hex");
    if (received.length !== expected.length ||
        !(0, node_crypto_1.timingSafeEqual)(received, expected)) {
        return next(new http_error_js_1.HttpError(401, "Invalid payment signature."));
    }
    next();
}
//# sourceMappingURL=verify-paystack-webhook.js.map