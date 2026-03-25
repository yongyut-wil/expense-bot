/**
 * Test สำหรับ LINE Signature Verification Middleware
 * ทดสอบการตรวจสอบ signature ของ webhook จาก LINE
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { verifyLineSignature } from "../../middleware/lineSignature";
import { UnauthorizedError } from "../../utils/errors";
import { config } from "../../config";

describe("LINE Signature Verification Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    const rawBody = JSON.stringify({ test: "data" });
    req = {
      headers: {},
      body: { test: "data" },
      ip: "127.0.0.1",
      rawBody, // ⭐ เพิ่ม rawBody
    } as any;
    res = {};
    next = jest.fn();
  });

  describe("Valid signature", () => {
    it("should call next() when signature is valid", () => {
      const rawBody = (req as any).rawBody;
      const validSignature = crypto
        .createHmac("sha256", config.LINE_CHANNEL_SECRET)
        .update(rawBody)
        .digest("base64");

      req.headers = { "x-line-signature": validSignature };

      verifyLineSignature(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("Invalid signature", () => {
    it("should call next with UnauthorizedError when signature is missing", () => {
      req.headers = {};

      verifyLineSignature(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Missing LINE signature",
          statusCode: 401,
        })
      );
    });

    it("should call next with UnauthorizedError when raw body is missing", () => {
      req.headers = { "x-line-signature": "some-signature" };
      delete (req as any).rawBody;

      verifyLineSignature(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Raw body not available for verification",
          statusCode: 401,
        })
      );
    });

    it("should call next with UnauthorizedError when signature is incorrect", () => {
      req.headers = { "x-line-signature": "invalid-signature" };

      verifyLineSignature(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid LINE signature",
          statusCode: 401,
        })
      );
    });

    it("should call next with UnauthorizedError when signature length differs", () => {
      const rawBody = (req as any).rawBody;
      const validSignature = crypto
        .createHmac("sha256", config.LINE_CHANNEL_SECRET)
        .update(rawBody)
        .digest("base64");

      // ลด signature ให้สั้นกว่า
      req.headers = { "x-line-signature": validSignature.substring(0, 10) };

      verifyLineSignature(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid LINE signature",
          statusCode: 401,
        })
      );
    });
  });

  describe("Timing attack prevention", () => {
    it("should use timingSafeEqual for comparison", () => {
      const cryptoSpy = jest.spyOn(crypto, "timingSafeEqual");

      const rawBody = (req as any).rawBody;
      const validSignature = crypto
        .createHmac("sha256", config.LINE_CHANNEL_SECRET)
        .update(rawBody)
        .digest("base64");

      req.headers = { "x-line-signature": validSignature };

      verifyLineSignature(req as Request, res as Response, next);

      expect(cryptoSpy).toHaveBeenCalled();
      cryptoSpy.mockRestore();
    });
  });

  describe("Different body content", () => {
    it("should generate different signatures for different bodies", () => {
      const body1 = JSON.stringify({ test: "data1" });
      const body2 = JSON.stringify({ test: "data2" });

      const sig1 = crypto
        .createHmac("sha256", config.LINE_CHANNEL_SECRET)
        .update(body1)
        .digest("base64");

      const sig2 = crypto
        .createHmac("sha256", config.LINE_CHANNEL_SECRET)
        .update(body2)
        .digest("base64");

      expect(sig1).not.toBe(sig2);
    });
  });
});
