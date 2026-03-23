import { config } from "../config";
import { AIProvider } from "./types";
// import { AnthropicProvider } from "./anthropic";
// import { OpenAIProvider } from "./openai";
import { GoogleProvider } from "./google";
import { parseFallback } from "./fallback";
import { logger } from "../utils/logger";
import { ParsedExpense } from "../types";

// Factory function — อ่าน AI_PROVIDER จาก env แล้วสร้าง instance ที่ถูกต้อง
function createAIProvider(): AIProvider {
  const provider = config.AI_PROVIDER;
  logger.info(`Using AI provider: ${provider}`);

  switch (provider) {
    // case "anthropic":
    //   if (!config.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required");
      // return new AnthropicProvider(config.ANTHROPIC_API_KEY);

    // case "openai":
    //   if (!config.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
      // return new OpenAIProvider(config.OPENAI_API_KEY);

    case "google":
      if (!config.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is required");
      return new GoogleProvider(config.GOOGLE_API_KEY);

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// Singleton — สร้างครั้งเดียวตอน import
const aiProvider = createAIProvider();

// Export function เดิม — ส่วนอื่นของ codebase ไม่ต้องแก้อะไรเลย
export async function parseExpenseMessage(text: string): Promise<ParsedExpense> {
  try {
    return await aiProvider.parseExpense(text);
  } catch (err) {
    logger.warn("AI provider failed, using fallback parser", { 
      error: (err as Error).message 
    });
    return parseFallback(text);
  }
}