"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const http_error_js_1 = require("../lib/http-error.js");
const errorHandler = (error, _request, response, _next) => {
    if (error instanceof zod_1.ZodError) {
        response.status(400).json({
            error: "Please check the submitted fields.",
            details: error.flatten().fieldErrors,
        });
        return;
    }
    if (error instanceof http_error_js_1.HttpError) {
        response.status(error.statusCode).json({ error: error.message });
        return;
    }
    if (error instanceof multer_1.default.MulterError || error?.name === "MulterError") {
        response.status(400).json({
            error: error.code === "LIMIT_FILE_SIZE"
                ? `Image must be ${process.env.MAX_UPLOAD_MB ?? 8} MB or smaller.`
                : "The image could not be uploaded.",
        });
        return;
    }
    if (error instanceof Error &&
        error.message === "Only JPEG, PNG and WEBP images are accepted.") {
        response.status(400).json({ error: error.message });
        return;
    }
    if (error?.code === "P2003") {
        response
            .status(400)
            .json({ error: "The selected audition category is not available." });
        return;
    }
    if (error?.code === "P2025") {
        response.status(404).json({ error: "The requested record was not found." });
        return;
    }
    console.error(error);
    response
        .status(500)
        .json({ error: "Something went wrong. Please try again later." });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error-handler.js.map