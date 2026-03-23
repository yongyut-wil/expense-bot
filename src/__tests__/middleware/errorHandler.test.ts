/**
 * Test สำหรับ Error Handler Middleware
 * ทดสอบการจัดการ error และ async handler wrapper
 */

import { Request, Response, NextFunction } from "express";
import { errorHandler, asyncHandler } from "../../middleware/errorHandler";
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from "../../utils/errors";

describe("Error Handler Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      path: "/test-path",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("AppError handling", () => {
    it("should handle ValidationError with 400 status", () => {
      const error = new ValidationError("Invalid input");

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
        },
      });
    });

    it("should handle UnauthorizedError with 401 status", () => {
      const error = new UnauthorizedError("Unauthorized access");

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized access",
        },
      });
    });

    it("should handle NotFoundError with 404 status", () => {
      const error = new NotFoundError("Resource");

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
      });
    });

    it("should handle custom AppError", () => {
      const error = new AppError("Custom error", 418, "CUSTOM_ERROR");

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "CUSTOM_ERROR",
          message: "Custom error",
        },
      });
    });
  });

  describe("Unexpected error handling", () => {
    it("should handle generic Error with 500 status in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Unexpected error");

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unexpected error",
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should show error message in development", () => {
      // config.NODE_ENV คือ development (default)
      const error = new Error("Sensitive error details");

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_ERROR",
          message: "Sensitive error details", // แสดง error message ใน development
        },
      });
    });
  });

  describe("asyncHandler wrapper", () => {
    it("should handle successful async function", async () => {
      const asyncFn = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(asyncFn);

      await wrapped(req as Request, res as Response, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it("should catch rejected promise and call next with error", async () => {
      const error = new Error("Async error");
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(asyncFn);

      await wrapped(req as Request, res as Response, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it("should catch rejected promise and call next", async () => {
      const error = new Error("Async error");
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(asyncFn);

      await wrapped(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
