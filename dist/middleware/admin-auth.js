"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAdminToken = signAdminToken;
exports.authenticateAdmin = authenticateAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_error_js_1 = require("../lib/http-error.js");
function jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret)
        return secret;
    if (process.env.NODE_ENV === "production") {
        throw new http_error_js_1.HttpError(503, "Admin sign-in is not configured.");
    }
    return "zam-dev-admin-secret";
}
function signAdminToken(email) {
    return jsonwebtoken_1.default.sign({ sub: "admin", email, role: "admin" }, jwtSecret(), {
        expiresIn: "8h",
    });
}
function authenticateAdmin(request, _response, next) {
    const header = request.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
        next(new http_error_js_1.HttpError(401, "Authentication required."));
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, jwtSecret(), {
            algorithms: ["HS256"],
        });
        if (payload.role !== "admin") {
            throw new Error("Invalid admin payload");
        }
        request.admin = payload;
        next();
    }
    catch {
        next(new http_error_js_1.HttpError(401, "Invalid or expired session."));
    }
}
//# sourceMappingURL=admin-auth.js.map