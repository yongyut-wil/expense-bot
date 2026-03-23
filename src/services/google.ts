import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider } from "./types";
import { ParsedExpense } from "../types";
import { ExternalServiceError } from "../utils/errors";
import { logger } from "../utils/logger";
import { SYSTEM_PROMPT } from "../services/ai/prompt";

export class GoogleProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async parseExpense(text: string): Promise<ParsedExpense> {
    logger.debug("Using Google Gemini provider");
    try {
      const model = this.client.getGenerativeModel({
        model: "gemini-pro",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const prompt = `${SYSTEM_PROMPT}\n\nUser message: ${text}`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      return JSON.parse(raw) as ParsedExpense;
    } catch (err) {
      if (err instanceof SyntaxError) {
        return { type: "UNKNOWN", amount: null, description: text, category: "อื่นๆ" };
      }
      throw new ExternalServiceError("Google Gemini", (err as Error).message);
    }
  }
}