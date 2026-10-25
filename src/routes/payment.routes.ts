import { Router } from "express";
import {
  initializePayment,
  receivePaystackWebhook,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { verifyPaystackWebhook } from "../middleware/verify-paystack-webhook.js";

export const paymentRoutes = Router();
paymentRoutes.post("/initialize", initializePayment);
paymentRoutes.post("/verify", verifyPayment);
paymentRoutes.post("/webhook", verifyPaystackWebhook, receivePaystackWebhook);
