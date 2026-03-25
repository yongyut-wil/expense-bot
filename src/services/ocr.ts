import { config } from "../config";
import { GoogleProvider } from "./google";
import { OcrResult } from "../types";
import { logger } from "../utils/logger";

const googleProvider = new GoogleProvider(config.GOOGLE_API_KEY!);

export async function parseSlipImage(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Promise<OcrResult> {
  logger.info("Parsing slip image");
  return googleProvider.parseSlip(imageBase64, mimeType);
}
