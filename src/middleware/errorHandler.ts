import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { config } from "../config";

// Global error handler — วางไว้ท้ายสุดของ middleware chain เสมอ
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // AppError = คาดการณ์ได้ → log warn
  if (err instanceof AppError) {
    logger.warn("Operational error", {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Error อื่น = ไม่คาดการณ์ → log error + stack
  logger.error("Unexpected error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  // Production: ซ่อน stack trace จาก user
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message:
        config.NODE_ENV === "production" ? "Something went wrong" : err.message,
    },
  });
}

// Wrapper สำหรับ async route handler — จัดการ unhandled rejection อัตโนมัติ
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
