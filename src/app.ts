import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler.js";
import { uploadRoot } from "./middleware/upload.js";
import { apiRoutes } from "./routes/index.js";

export const app = express();
const allowedOrigins = new Set(
  (process.env.WEB_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
);
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://localhost:5174");
}

app.disable("x-powered-by");
// cPanel (Passenger) sits behind a reverse proxy; trust it so rate limiting
// keys on the real client IP rather than the proxy's.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) callback(null, true);
      else callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// Portraits are shown in the admin dashboard, which runs on the web origin.
app.use(
  "/uploads",
  helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
  express.static(uploadRoot, { index: false, dotfiles: "deny", maxAge: "7d" }),
);
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "32kb" }));
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use(
  "/api/admin/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again later." },
  }),
);
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (request) => request.path === "/payments/webhook",
    message: { error: "Too many requests. Please try again later." },
  }),
);
app.use("/api", apiRoutes);
app.use(errorHandler);
