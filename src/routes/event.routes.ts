import { Router } from "express";
import { listEvents } from "../controllers/event.controller.js";

export const eventRoutes = Router();
eventRoutes.get("/", listEvents);
