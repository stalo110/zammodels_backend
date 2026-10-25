"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const admin_controller_js_1 = require("../controllers/admin.controller.js");
const admin_auth_js_1 = require("../middleware/admin-auth.js");
exports.adminRoutes = (0, express_1.Router)();
exports.adminRoutes.post("/login", admin_controller_js_1.loginAdmin);
exports.adminRoutes.get("/stats", admin_auth_js_1.authenticateAdmin, admin_controller_js_1.getDashboardStats);
exports.adminRoutes.get("/participants", admin_auth_js_1.authenticateAdmin, admin_controller_js_1.getParticipants);
exports.adminRoutes.patch("/participants/:id/status", admin_auth_js_1.authenticateAdmin, admin_controller_js_1.updateParticipantStatus);
exports.adminRoutes.get("/inquiries", admin_auth_js_1.authenticateAdmin, admin_controller_js_1.getInquiries);
exports.adminRoutes.post("/inquiries/:id/reply", admin_auth_js_1.authenticateAdmin, admin_controller_js_1.replyToInquiry);
exports.adminRoutes.get("/settings", admin_auth_js_1.authenticateAdmin, admin_controller_js_1.getSettings);
exports.adminRoutes.patch("/settings", admin_auth_js_1.authenticateAdmin, admin_controller_js_1.updateSettings);
exports.adminRoutes.post("/broadcast", admin_auth_js_1.authenticateAdmin, admin_controller_js_1.sendBroadcastEmail);
//# sourceMappingURL=admin.routes.js.map