import "dotenv/config";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const isProduction = process.env.NODE_ENV === "production";

function assertProductionConfig() {
  const required = [
    "DATABASE_URL",
    "WEB_ORIGIN",
    "JWT_SECRET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "PAYSTACK_SECRET_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }
  const paystackApi = process.env.PAYSTACK_API_URL;
  if (paystackApi && !paystackApi.startsWith("https://")) {
    throw new Error("PAYSTACK_API_URL must not point at a mock in production; remove it.");
  }

  const warnings: string[] = [];
  if (process.env.PAYSTACK_SECRET_KEY!.startsWith("sk_test_")) {
    warnings.push("PAYSTACK_SECRET_KEY is a TEST key; no real payments will be collected.");
  }
  if (process.env.WEB_ORIGIN!.split(",").some((o) => !o.trim().startsWith("https://"))) {
    warnings.push("WEB_ORIGIN contains a non-https origin.");
  }
  const callback = process.env.PAYSTACK_CALLBACK_URL;
  if (!callback?.startsWith("https://") || !callback.endsWith("/payment/verify")) {
    warnings.push("PAYSTACK_CALLBACK_URL should be https://<site>/payment/verify.");
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    warnings.push("SMTP is not configured; inquiry replies and broadcasts will fail.");
  }
  for (const warning of warnings) console.warn(`[config] ${warning}`);
}

// Applies pending Prisma migrations before the API accepts traffic, so a
// fresh deploy (or redeploy with new migrations) needs no manual SSH step.
function runMigrations() {
  const prismaCli = fileURLToPath(
    new URL("../node_modules/prisma/build/index.js", import.meta.url),
  );
  const schema = fileURLToPath(
    new URL("../prisma/schema.prisma", import.meta.url),
  );
  console.log("Applying database migrations...");
  execFileSync(
    process.execPath,
    [prismaCli, "migrate", "deploy", "--schema", schema],
    { stdio: "inherit", env: process.env },
  );
}

if (isProduction) assertProductionConfig();
const shouldMigrate = process.env.RUN_MIGRATIONS_ON_START
  ? process.env.RUN_MIGRATIONS_ON_START === "true"
  : isProduction;
if (shouldMigrate) runMigrations();

const { app } = await import("./app.js");
const { prisma } = await import("./lib/prisma.js");

const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () =>
  console.log(`Zam API listening on port ${port}`),
);

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
