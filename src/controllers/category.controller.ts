import type { NextFunction, Request, Response } from "express";
import { categoryModel } from "../models/category.model.js";

export async function listCategories(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.json({ data: await categoryModel.list() });
  } catch (error) {
    next(error);
  }
}
