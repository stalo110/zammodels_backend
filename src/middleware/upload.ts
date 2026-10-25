import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export const auditionImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, uploadRoot),
    filename: (_request, file, callback) =>
      callback(
        null,
        `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      ),
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
