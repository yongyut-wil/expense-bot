import { Request, Response, NextFunction } from "express";

/**
 * Middleware เก็บ raw body ไว้ใน req.rawBody
 * ใช้สำหรับการ verify signature ที่ต้องการ raw body
 *
 * ⚠️ ต้องใส่ก่อน express.json()
 */
export function captureRawBody(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let data = "";

  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", () => {
    (req as any).rawBody = data;
    next();
  });
}
