"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRoutes = void 0;
const express_1 = require("express");
const admin_routes_js_1 = require("./admin.routes.js");
const category_routes_js_1 = require("./category.routes.js");
const event_routes_js_1 = require("./event.routes.js");
const inquiry_routes_js_1 = require("./inquiry.routes.js");
const payment_routes_js_1 = require("./payment.routes.js");
const registration_routes_js_1 = require("./registration.routes.js");
exports.apiRoutes = (0, express_1.Router)();
exports.apiRoutes.use("/admin", admin_routes_js_1.adminRoutes);
exports.apiRoutes.use("/categories", category_routes_js_1.categoryRoutes);
exports.apiRoutes.use("/registrations", registration_routes_js_1.registrationRoutes);
exports.apiRoutes.use("/events", event_routes_js_1.eventRoutes);
exports.apiRoutes.use("/inquiries", inquiry_routes_js_1.inquiryRoutes);
exports.apiRoutes.use("/payments", payment_routes_js_1.paymentRoutes);
//# sourceMappingURL=index.js.map