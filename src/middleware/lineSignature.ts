import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config";
import { UnauthorizedError } from "../utils/errors";
import { logger } from "../utils/logger";

export function verifyLineSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signature = req.headers["x-line-signature"] as string;

  if (!signature) {
    logger.warn("Missing LINE signature", { ip: req.ip });
    return next(new UnauthorizedError("Missing LINE signature"));
  }

  // ใช้ raw body ที่เก็บไว้จาก captureRawBody middleware
  const rawBody = (req as any).rawBody as string;

  if (!rawBody) {
    logger.error("Raw body not available for signature verification");
    return next(
      new UnauthorizedError("Raw body not available for verification")
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", config.LINE_CHANNEL_SECRET)
    .update(rawBody)
    .digest("base64");

  // timingSafeEqual ป้องกัน timing attack
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  const isValid =
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer);

  if (!isValid) {
    logger.warn("Invalid LINE signature", {
      ip: req.ip,
      signatureLength: signature.length,
      expectedLength: expectedSignature.length,
    });
    return next(new UnauthorizedError("Invalid LINE signature"));
  }

  next();
}
