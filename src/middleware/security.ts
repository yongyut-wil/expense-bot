import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { logger } from "../utils/logger";

// Helmet — ตั้งค่า HTTP security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
});

// Rate limiter ทั่วไป
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn("Rate limit exceeded", { ip: req.ip, path: req.path });
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    });
  },
});

// Rate limiter เฉพาะ webhook — LINE ส่ง batch มาได้เยอะ
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
