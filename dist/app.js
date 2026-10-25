"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const error_handler_js_1 = require("./middleware/error-handler.js");
const upload_js_1 = require("./middleware/upload.js");
const index_js_1 = require("./routes/index.js");
exports.app = (0, express_1.default)();
const allowedOrigins = new Set((process.env.WEB_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean));
if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
    allowedOrigins.add("http://localhost:5174");
}
exports.app.disable("x-powered-by");
// cPanel (Passenger) sits behind a reverse proxy; trust it so rate limiting
// keys on the real client IP rather than the proxy's.
exports.app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin))
            callback(null, true);
        else
            callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Portraits are shown in the admin dashboard, which runs on the web origin.
exports.app.use("/uploads", helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }), express_1.default.static(upload_js_1.uploadRoot, { index: false, dotfiles: "deny", maxAge: "7d" }));
exports.app.use("/api/payments/webhook", express_1.default.raw({ type: "application/json" }));
exports.app.use(express_1.default.json({ limit: "32kb" }));
exports.app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
exports.app.use("/api/admin/login", (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again later." },
}));
exports.app.use("/api", (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (request) => request.path === "/payments/webhook",
    message: { error: "Too many requests. Please try again later." },
}));
exports.app.use("/api", index_js_1.apiRoutes);
exports.app.use(error_handler_js_1.errorHandler);
//# sourceMappingURL=app.js.map