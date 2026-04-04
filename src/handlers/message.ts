import { z } from "zod";
import { Request, Response } from "express";
import { WebhookEvent, TextEventMessage, PostbackEvent } from "@line/bot-sdk";
import {
  lineClient,
  replyText,
  sendExpenseConfirmMessage,
  formatSummaryMessage,
  formatRecentMessage,
  sendOcrConfirmMessage,
} from "../services/line";
import { parseExpenseMessage } from "../services";
import {
  saveExpense,
  getMonthlySummary,
  getRecentExpenses,
} from "../services/expense";
import { logger } from "../utils/logger";
import { ValidationError } from "../utils/errors";
import { parseSlipImage } from "../services/ocr";
import { setPending } from "../services/pendingStore";
import { handlePostback } from "./postback";
import axios from "axios";
import { config } from "../config";

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
          id: z.string().optional(), // ← เพิ่ม id สำหรับ image
          text: z.string().optional(),
        })
        .optional(),
      postback: z // ← เพิ่ม postback
        .object({
          data: z.string(),
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

const HELP_TEXT = `วิธีใช้Expense-Bot 📖

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
    body: req.body,
  });

  // Validate payload ก่อนประมวลผล
  const result = lineWebhookSchema.safeParse(req.body);
  if (!result.success) {
    logger.error("❌ LINE webhook validation failed", {
      errors: result.error.issues,
      receivedBody: req.body,
    });
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
      logger.info("🔍 Processing event", {
        type: event.type,
        messageType: event.message?.type,
      });

      // ---- postback (ปุ่ม confirm/cancel) ----
      if (event.type === "postback") {
        if (!event.source.userId || !event.replyToken) return;
        await handlePostback(event as unknown as PostbackEvent);
        return;
      }

      if (event.type !== "message") return;
      if (!event.replyToken || !event.source.userId) return;

      const userId = event.source.userId;
      const replyToken = event.replyToken;

      // ---- image message (สลิป) ----
      if (event.message?.type === "image") {
        await handleImageMessage(userId, event.message.id!, replyToken).catch(
          async (err) => {
            logger.error("Failed to process image", {
              error: (err as Error).message,
            });
            await lineClient
              .pushMessage(userId, {
                type: "text",
                text: "เกิดข้อผิดพลาดในการอ่านสลิปค่ะ ลองใหม่อีกครั้งนะคะ 🙏",
              })
              .catch(() => {});
          }
        );
        return;
      }

      // ---- text message (เดิม) ----
      if (event.message?.type !== "text") return;

      const text = event.message.text!.trim();
      const messageId = event.message.id!;
      logger.info("Received message", { userId, text });

      try {
        await processMessage(userId, text, replyToken, messageId);
      } catch (err) {
        logger.error("Failed to process message", {
          userId,
          text,
          error: (err as Error).message,
        });
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
  replyToken: string,
  messageId: string
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
      `Expense-Botไม่เข้าใจค่ะ 🙏\nลองพิมพ์ใหม่ เช่น "กินข้าว 120"\nหรือพิมพ์ "วิธีใช้" เพื่อดูคำแนะนำค่ะ`
    );
  }

  // เก็บ pending รอ confirm (ใช้ messageId เป็น key)
  setPending(messageId, userId, { parsedExpense: parsed });

  // ส่ง confirm message (พร้อม transaction ID) - ใช้ reply แทน push
  await sendExpenseConfirmMessage(
    replyToken,
    {
      type: parsed.type,
      amount: parsed.amount,
      description: parsed.description,
      category: parsed.category,
    },
    messageId
  );
}

async function handleImageMessage(
  userId: string,
  messageId: string,
  replyToken: string
) {
  logger.info("Received image message", { userId, messageId });

  // Download รูปจาก LINE
  const imageBuffer = await downloadLineImage(messageId);
  const base64 = imageBuffer.toString("base64");

  // ส่งให้ Google Vision วิเคราะห์
  const ocrResult = await parseSlipImage(base64, "image/jpeg");

  if (!ocrResult.success || !ocrResult.amount) {
    return replyText(
      replyToken,
      "Expense-Botอ่านสลิปไม่ออกค่ะ 😅\nลองถ่ายใหม่ให้ชัดขึ้น หรือพิมพ์ข้อมูลเองได้เลยนะคะ"
    );
  }

  // เก็บ pending รอ confirm (ใช้ messageId เป็น key)
  setPending(messageId, userId, { ocrResult, imageMessageId: messageId });

  // ส่ง confirm message (พร้อม transaction ID) - ใช้ reply แทน push
  await sendOcrConfirmMessage(replyToken, ocrResult, messageId);
}

async function downloadLineImage(messageId: string): Promise<Buffer> {
  const response = await axios.get(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    {
      headers: {
        Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      responseType: "arraybuffer",
    }
  );
  return Buffer.from(response.data as ArrayBuffer);
}
