import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, OCRProvider } from "./types";
import { ParsedExpense, OcrResult } from "../types";
import { ExternalServiceError } from "../utils/errors";
import { logger } from "../utils/logger";
import { SYSTEM_PROMPT } from "../services/ai/prompt";

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return braceMatch[0];
  }
  return text.trim();
}

const OCR_PROMPT = `คุณคือผู้เชี่ยวชาญอ่านสลิปและใบเสร็จไทย ตอบเป็น JSON เท่านั้น ห้ามมี text อื่น

รูปแบบ JSON ที่ต้องตอบ:
{
  "success": true/false,
  "type": "INCOME" | "EXPENSE" | "UNKNOWN",
  "amount": number | null,
  "description": "รายละเอียดสั้นๆ",
  "category": "หมวดหมู่",
  "date": "YYYY-MM-DD" | null,
  "merchant": "ชื่อร้านหรือผู้รับเงิน" | null,
  "confidence": "high" | "medium" | "low"
}

หมวดหมู่ที่ใช้ได้: อาหาร, เดินทาง, ช้อปปิ้ง, บันเทิง, สุขภาพ, ที่พัก, สาธารณูปโภค, โอนเงิน, รายได้อื่น, อื่นๆ

กฎการอ่านสลิป:
- สลิปโอนเงิน: amount คือยอดโอน ไม่ใช่เลขบัญชี, type = EXPENSE
- ใบเสร็จร้านค้า: amount คือยอดรวมสุทธิ, type = EXPENSE
- รับโอนเงิน: type = INCOME
- ถ้าอ่านไม่ออกหรือไม่ใช่สลิป: success = false
- confidence = high ถ้ามั่นใจ 90%+, medium 70-90%, low ต่ำกว่า 70%`;

export class GoogleProvider implements AIProvider, OCRProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  // ---- AIProvider (เดิม) ----
  async parseExpense(text: string): Promise<ParsedExpense> {
    logger.debug("Using Google Gemini provider");
    try {
      const model = this.client.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const prompt = `${SYSTEM_PROMPT}\n\nUser message: ${text}`;
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      return JSON.parse(raw) as ParsedExpense;
    } catch (err) {
      if (err instanceof SyntaxError) {
        return {
          type: "UNKNOWN",
          amount: null,
          description: text,
          category: "อื่นๆ",
        };
      }
      throw new ExternalServiceError("Google Gemini", (err as Error).message);
    }
  }

  // ---- OCRProvider (ใหม่) ----
  async parseSlip(
    imageBase64: string,
    mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
  ): Promise<OcrResult> {
    logger.debug("Using Google Gemini Vision for OCR");
    try {
      const model = this.client.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const result = await model.generateContent([
        { text: OCR_PROMPT },
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        { text: "กรุณาอ่านสลิปหรือใบเสร็จนี้และแปลงเป็น JSON" },
      ]);

      const raw = result.response.text();
      logger.debug("Raw OCR response", { raw: raw.substring(0, 200) });
      const jsonString = extractJSON(raw);
      const parsed = JSON.parse(jsonString) as OcrResult;

      logger.info("OCR result", {
        success: parsed.success,
        amount: parsed.amount,
        confidence: parsed.confidence,
      });

      return parsed;
    } catch (err) {
      if (err instanceof SyntaxError) {
        logger.warn("Failed to parse OCR response as JSON", {
          error: (err as Error).message,
        });
        return {
          success: false,
          type: "UNKNOWN",
          amount: null,
          description: "อ่านสลิปไม่สำเร็จ",
          category: "อื่นๆ",
          date: null,
          merchant: null,
          confidence: "low",
        };
      }
      throw new ExternalServiceError(
        "Google Gemini Vision",
        (err as Error).message
      );
    }
  }
}
