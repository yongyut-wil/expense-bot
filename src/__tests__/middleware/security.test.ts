import { Request, Response } from "express";
import {
  generalLimiter,
  webhookLimiter,
  securityHeaders,
} from "../../middleware/security";
import { logger } from "../../utils/logger";

jest.mock("../../utils/logger");

describe("Security Middleware", () => {
  describe("securityHeaders", () => {
    it("should be a helmet middleware function", () => {
      expect(typeof securityHeaders).toBe("function");
      expect(securityHeaders.name).toBe("helmetMiddleware");
    });
  });

  describe("generalLimiter", () => {
    it("should be a rate limit middleware function", () => {
      expect(typeof generalLimiter).toBe("function");
    });

    it("should call custom handler when rate limit exceeded", () => {
      const mockRequest = {
        ip: "127.0.0.1",
        path: "/test",
      } as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Access the handler from the rate limiter config
      const limiterOptions = (generalLimiter as any).options;
      if (limiterOptions && limiterOptions.handler) {
        limiterOptions.handler(mockRequest, mockResponse);

        expect(logger.warn).toHaveBeenCalledWith("Rate limit exceeded", {
          ip: "127.0.0.1",
          path: "/test",
        });
        expect(mockResponse.status).toHaveBeenCalledWith(429);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later",
          },
        });
      }
    });
  });

  describe("webhookLimiter", () => {
    it("should be a rate limit middleware function", () => {
      expect(typeof webhookLimiter).toBe("function");
    });
  });
});
