import express from "express";
import {
  securityHeaders,
  generalLimiter,
  webhookLimiter,
} from "./middleware/security";
import { verifyLineSignature } from "./middleware/lineSignature";
import { errorHandler, asyncHandler } from "./middleware/errorHandler";
import { webhookHandler } from "./handlers/message";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();

  // Trust proxy — จำเป็นเมื่อรันหลัง reverse proxy (ngrok, nginx, cloud load balancer)
  app.set("trust proxy", 1);

  // 1. Security headers — วางก่อนทุกอย่าง
  app.use(securityHeaders);

  // 2. Rate limiting ทั่วไป
  app.use(generalLimiter);

  // 3. Parse JSON body
  app.use(express.json());

  // 4. Health check — ไม่ต้อง auth ใช้เช็คว่า server ยังรันอยู่
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // 5. LINE Webhook
  app.post(
    "/webhook",
    (req, res, next) => {
      logger.info("🎯 POST /webhook hit", {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
      next();
    },
    webhookLimiter, // rate limit เฉพาะ webhook
    verifyLineSignature, // verify ว่ามาจาก LINE จริง
    asyncHandler(webhookHandler)
  );

  // 6. 404 handler
  app.use((req, res) => {
    logger.warn("Route not found", { path: req.path, method: req.method });
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    });
  });

  // 7. Global error handler — ต้องอยู่ท้ายสุดเสมอ
  app.use(errorHandler);

  return app;
}
