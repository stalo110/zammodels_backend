import { Router } from "express";
import { adminRoutes } from "./admin.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { eventRoutes } from "./event.routes.js";
import { inquiryRoutes } from "./inquiry.routes.js";
import { paymentRoutes } from "./payment.routes.js";
import { registrationRoutes } from "./registration.routes.js";

export const apiRoutes = Router();
apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/categories", categoryRoutes);
apiRoutes.use("/registrations", registrationRoutes);
apiRoutes.use("/events", eventRoutes);
apiRoutes.use("/inquiries", inquiryRoutes);
apiRoutes.use("/payments", paymentRoutes);
