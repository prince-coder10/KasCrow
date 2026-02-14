import AppError from "../errors/AppError.js";
import type { Response } from "express";

export const catchError = (res: Response, error: any) => {
  return res
    .status(
      error instanceof AppError && "statusCode" in error
        ? error.statusCode
        : 500,
    )
    .json({
      success: false,
      message:
        error instanceof AppError ? error.message : "Internal server error",
      error,
    });
};
