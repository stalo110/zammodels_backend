import { Router } from "express";
import {
  getDashboardStats,
  getInquiries,
  getParticipants,
  getSettings,
  loginAdmin,
  replyToInquiry,
  sendBroadcastEmail,
  updateParticipantStatus,
  updateSettings,
} from "../controllers/admin.controller.js";
import { authenticateAdmin } from "../middleware/admin-auth.js";

export const adminRoutes = Router();
adminRoutes.post("/login", loginAdmin);
adminRoutes.get("/stats", authenticateAdmin, getDashboardStats);
adminRoutes.get("/participants", authenticateAdmin, getParticipants);
adminRoutes.patch(
  "/participants/:id/status",
  authenticateAdmin,
  updateParticipantStatus,
);
adminRoutes.get("/inquiries", authenticateAdmin, getInquiries);
adminRoutes.post("/inquiries/:id/reply", authenticateAdmin, replyToInquiry);
adminRoutes.get("/settings", authenticateAdmin, getSettings);
adminRoutes.patch("/settings", authenticateAdmin, updateSettings);
adminRoutes.post("/broadcast", authenticateAdmin, sendBroadcastEmail);
