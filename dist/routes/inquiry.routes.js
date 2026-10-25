"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryRoutes = void 0;
const express_1 = require("express");
const inquiry_controller_js_1 = require("../controllers/inquiry.controller.js");
exports.inquiryRoutes = (0, express_1.Router)();
exports.inquiryRoutes.post("/", inquiry_controller_js_1.createInquiry);
//# sourceMappingURL=inquiry.routes.js.map