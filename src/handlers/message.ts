import { z } from "zod";
import { Request, Response } from "express";
// import { parseExpenseMessage } from "../services/ai";
import {
  saveExpense,
  getMonthlySummary,
  getRecentExpenses,
} from "../services/expense";
import {
  replyText,
  formatSummaryMessage,
  formatRecentMessage,
} from "../services/line";
import { logger } from "../utils/logger";
import { ValidationError } from "../utils/errors";
import { parseExpenseMessage } from "../services";

// Validate structure ของ LINE webhook payload
const lineWebhookSchema = z.object({
  events: z.array(
    z.object({
      type: z.string(),
      replyToken: z.string().optional(),
      source: z.object({
        userId: z.string().optional(),
        type: z.string(),
      }),
      message: z
        .object({
          type: z.string(),
          text: z.string().optional(),
        })
        .optional(),
    })
  ),
});

const COMMANDS = {
  SUMMARY: ["สรุป", "ดูสรุป", "summary"],
  RECENT: ["ล่าสุด", "recent", "รายการล่าสุด"],
  HELP: ["help", "ช่วยด้วย", "วิธีใช้"],
};

const HELP_TEXT = `วิธีใช้ป้านวล 📖

💸 บันทึกรายจ่าย:
  "กินข้าว 120"
  "ค่ารถ BTS 44 บาท"
  "ช้อปปิ้ง 500"

💰 บันทึกรายรับ:
  "รับเงินเดือน 30000"
  "ได้โบนัส 5000 บาท"

📊 คำสั่ง:
  "สรุป" — ดูสรุปเดือนนี้
  "ล่าสุด" — ดู 5 รายการล่าสุด`;

export async function webhookHandler(req: Request, res: Response) {
  logger.info("📥 Webhook received", { 
    headers: req.headers,
    body: req.body 
  });
  
  // Validate payload ก่อนประมวลผล
  const result = lineWebhookSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError("Invalid LINE webhook payload");
  }

  const { events } = result.data;
  logger.info("📦 Events received", { eventCount: events.length, events });

  // ตอบ LINE กลับทันที — LINE timeout 30 วินาที
  res.json({ status: "ok" });

  // ประมวลผลแบบ async หลังตอบ LINE แล้ว
  // ใช้ allSettled เพื่อให้ event อื่นยังทำงานได้แม้ event นึง fail
  await Promise.allSettled(
    events.map(async (event) => {
      logger.info("🔍 Processing event", { type: event.type, messageType: event.message?.type });
      
      if (event.type !== "message") {
        logger.info("⏭️ Skipping non-message event", { type: event.type });
        return;
      }
      if (event.message?.type !== "text") {
        logger.info("⏭️ Skipping non-text message", { type: event.message?.type });
        return;
      }
      if (!event.replyToken || !event.source.userId) {
        logger.warn("⚠️ Missing replyToken or userId", { 
          hasReplyToken: !!event.replyToken, 
          hasUserId: !!event.source.userId 
        });
        return;
      }

      const text = event.message.text!.trim();
      const userId = event.source.userId;
      const replyToken = event.replyToken;

      logger.info("Received message", { userId, text });

      try {
        await processMessage(userId, text, replyToken);
      } catch (err) {
        logger.error("Failed to process message", {
          userId,
          text,
          error: (err as Error).message,
        });
        // แจ้ง user ว่าเกิด error แทนที่จะ silent fail
        await replyText(
          replyToken,
          "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะคะ 🙏"
        ).catch(() => {});
      }
    })
  );
}

async function processMessage(
  userId: string,
  text: string,
  replyToken: string
) {
  logger.info("⚙️ Processing message", { userId, text, replyToken });
  const normalized = text.toLowerCase().trim();

  if (COMMANDS.SUMMARY.includes(normalized)) {
    const summary = await getMonthlySummary(userId);
    return replyText(replyToken, formatSummaryMessage(summary));
  }

  if (COMMANDS.RECENT.includes(normalized)) {
    const recent = await getRecentExpenses(userId);
    return replyText(replyToken, formatRecentMessage(recent));
  }

  if (COMMANDS.HELP.includes(normalized)) {
    return replyText(replyToken, HELP_TEXT);
  }

  // ส่งให้ AI parse
  logger.info("🤖 Sending to AI", { text });
  const parsed = await parseExpenseMessage(text);
  logger.info("✅ AI response", { parsed });

  if (parsed.type === "UNKNOWN" || !parsed.amount) {
    return replyText(
      replyToken,
      `ป้านวลไม่เข้าใจค่ะ 🙏\nลองพิมพ์ใหม่ เช่น "กินข้าว 120"\nหรือพิมพ์ "วิธีใช้" เพื่อดูคำแนะนำค่ะ`
    );
  }

  await saveExpense(userId, parsed);

  const emoji = parsed.type === "INCOME" ? "💰" : "💸";
  const typeText = parsed.type === "INCOME" ? "รายรับ" : "รายจ่าย";

  return replyText(
    replyToken,
    `${emoji} บันทึก${typeText}แล้วค่ะ!\n📝 ${parsed.description}\n💵 ${parsed.amount.toLocaleString()} บาท\n🏷️ ${parsed.category}`
  );
}