"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditionImageUpload = exports.uploadRoot = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const multer_1 = __importDefault(require("multer"));
exports.uploadRoot = node_path_1.default.resolve(process.env.UPLOAD_DIR ?? "uploads");
node_fs_1.default.mkdirSync(exports.uploadRoot, { recursive: true });
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
exports.auditionImageUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_request, _file, callback) => callback(null, exports.uploadRoot),
        filename: (_request, file, callback) => callback(null, `${node_crypto_1.default.randomUUID()}${node_path_1.default.extname(file.originalname).toLowerCase()}`),
    }),
    limits: {
        fileSize: Number(process.env.MAX_UPLOAD_MB ?? 8) * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_request, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            callback(new Error("Only JPEG, PNG and WEBP images are accepted."));
            return;
        }
        callback(null, true);
    },
});
//# sourceMappingURL=upload.js.map