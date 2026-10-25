import { Router } from "express";
import { createRegistration } from "../controllers/registration.controller.js";
import { auditionImageUpload } from "../middleware/upload.js";

export const registrationRoutes = Router();
registrationRoutes.post(
  "/",
  auditionImageUpload.single("image"),
  createRegistration,
);
