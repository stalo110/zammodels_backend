"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInquiry = createInquiry;
const zod_1 = require("zod");
const inquiry_model_js_1 = require("../models/inquiry.model.js");
const inquirySchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2).max(160),
    email: zod_1.z.string().trim().email().max(255),
    phone: zod_1.z.string().trim().max(32).optional(),
    subject: zod_1.z.string().trim().min(3).max(180),
    message: zod_1.z.string().trim().min(10).max(5000),
});
async function createInquiry(request, response, next) {
    try {
        const inquiryInput = inquirySchema.parse(request.body);
        const inquiry = await inquiry_model_js_1.inquiryModel.create(inquiryInput);
        response
            .status(201)
            .json({ data: inquiry, message: "Your message has been sent." });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=inquiry.controller.js.map