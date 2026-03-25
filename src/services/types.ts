import { ParsedExpense, OcrResult } from "../types";

// Interface กลาง — ทุก provider ต้อง implement นี้
export interface AIProvider {
  parseExpense(text: string): Promise<ParsedExpense>;
}

// Interface สำหรับ OCR โดยเฉพาะ
export interface OCRProvider {
  parseSlip(
    imageBase64: string,
    mimeType: "image/jpeg" | "image/png" | "image/webp"
  ): Promise<OcrResult>;
}
