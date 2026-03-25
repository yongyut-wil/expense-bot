import { Client } from "@line/bot-sdk";
import { config } from "../config";
import { logger } from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";
import { MonthlySummary, RecentExpense, OcrResult } from "../types";

export const lineClient = new Client({
  channelAccessToken: config.LINE_CHANNEL_ACCESS_TOKEN,
});

export async function replyText(replyToken: string, text: string) {
  try {
    await lineClient.replyMessage(replyToken, { type: "text", text });
    logger.debug("Reply sent", { preview: text.slice(0, 50) });
  } catch (err) {
    throw new ExternalServiceError("LINE", (err as Error).message);
  }
}

export function formatSummaryMessage(summary: MonthlySummary): string {
  const monthName = new Date().toLocaleString("th-TH", { month: "long" });
  const balanceEmoji = summary.balance >= 0 ? "✅" : "⚠️";

  const categoryLines =
    summary.byCategory
      .map((c) => `  • ${c.category}: ${c.total.toLocaleString()} บาท`)
      .join("\n") || "  (ยังไม่มีรายการ)";

  return `📊 สรุปรายรับ-รายจ่าย เดือน${monthName}

💰 รายรับ: ${summary.totalIncome.toLocaleString()} บาท
💸 รายจ่าย: ${summary.totalExpense.toLocaleString()} บาท
${balanceEmoji} คงเหลือ: ${summary.balance.toLocaleString()} บาท

📂 รายจ่ายแยกหมวด:
${categoryLines}`;
}

export function formatRecentMessage(items: RecentExpense[]): string {
  if (items.length === 0) return "ยังไม่มีรายการค่ะ 😊";

  const lines = items.map((e) => {
    const emoji = e.type === "INCOME" ? "💰" : "💸";
    return `${emoji} ${e.description} — ${e.amount.toLocaleString()} บาท`;
  });

  return `5 รายการล่าสุด:\n${lines.join("\n")}`;
}

export async function sendOcrConfirmMessage(
  userId: string,
  ocr: OcrResult
): Promise<void> {
  const confidenceColor = {
    high: "#27ACB2",
    medium: "#F39C12",
    low: "#E74C3C",
  }[ocr.confidence];

  const confidenceText = {
    high: "✅ มั่นใจสูง",
    medium: "⚠️ มั่นใจปานกลาง",
    low: "❓ มั่นใจต่ำ กรุณาตรวจสอบ",
  }[ocr.confidence];

  const typeText = ocr.type === "INCOME" ? "💰 รายรับ" : "💸 รายจ่าย";

  const flexMessage = {
    type: "flex" as const,
    altText: `ยืนยันการบันทึก ${ocr.amount?.toLocaleString()} บาท?`,
    contents: {
      type: "bubble" as const,
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        contents: [
          {
            type: "text" as const,
            text: "📋 ตรวจสอบข้อมูลจากสลิป",
            weight: "bold" as const,
            size: "lg" as const,
          },
          {
            type: "text" as const,
            text: `${typeText}: ${ocr.amount?.toLocaleString() ?? "-"} บาท`,
            margin: "md" as const,
          },
          {
            type: "text" as const,
            text: ocr.description,
            size: "sm" as const,
            color: "#888888",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "sm" as const,
        contents: [
          {
            type: "button" as const,
            style: "primary" as const,
            action: {
              type: "postback" as const,
              label: "✅ ยืนยัน",
              data: "action=confirm_expense",
            },
          },
          {
            type: "button" as const,
            style: "link" as const,
            action: {
              type: "postback" as const,
              label: "❌ ยกเลิก",
              data: "action=cancel_expense",
            },
          },
        ],
      },
    },
  };

  try {
    logger.debug("Sending Flex Message", {
      userId,
      payload: JSON.stringify(flexMessage).substring(0, 500),
    });

    await lineClient.pushMessage(userId, flexMessage);
    logger.debug("OCR confirm message sent", { userId });
  } catch (err) {
    const errorResponse = (err as any)?.response;
    const errorDetails = {
      message: (err as Error).message,
      status: errorResponse?.status,
      statusText: errorResponse?.statusText,
      data: errorResponse?.data,
      headers: errorResponse?.headers,
    };
    logger.error("Failed to send OCR confirm message", {
      error: (err as Error).message,
      fullError: JSON.stringify(errorDetails, null, 2),
    });
    throw new ExternalServiceError("LINE", (err as Error).message);
  }
}

// Helper สร้าง row สำหรับ Flex Message
function buildRow(label: string, value: string, valueColor?: string) {
  return {
    type: "box" as const,
    layout: "horizontal" as const,
    contents: [
      {
        type: "text" as const,
        text: label,
        color: "#888888",
        size: "sm" as const,
        flex: 2,
      },
      {
        type: "text" as const,
        text: value,
        size: "sm" as const,
        flex: 3,
        wrap: true,
        ...(valueColor ? { color: valueColor, weight: "bold" as const } : {}),
      },
    ],
  };
}
