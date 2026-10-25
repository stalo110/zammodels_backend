import type { NextFunction, Request, Response } from "express";
import { eventModel } from "../models/event.model.js";

export async function listEvents(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.json({ data: await eventModel.list() });
  } catch (error) {
    next(error);
  }
}
