"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_js_1 = require("../controllers/payment.controller.js");
const verify_paystack_webhook_js_1 = require("../middleware/verify-paystack-webhook.js");
exports.paymentRoutes = (0, express_1.Router)();
exports.paymentRoutes.post("/initialize", payment_controller_js_1.initializePayment);
exports.paymentRoutes.post("/verify", payment_controller_js_1.verifyPayment);
exports.paymentRoutes.post("/webhook", verify_paystack_webhook_js_1.verifyPaystackWebhook, payment_controller_js_1.receivePaystackWebhook);
//# sourceMappingURL=payment.routes.js.map