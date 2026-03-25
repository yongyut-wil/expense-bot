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

  try {
    // ใช้ pushMessage เพราะ replyToken ถูกใช้ไปแล้วตอนตอบ "กำลังอ่านสลิป"
    await lineClient.pushMessage(userId, {
      type: "flex",
      altText: `ยืนยันการบันทึก ${ocr.amount?.toLocaleString()} บาท?`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#27ACB2",
          paddingAll: "md",
          contents: [
            {
              type: "text",
              text: "📋 ตรวจสอบข้อมูลจากสลิป",
              weight: "bold",
              color: "#ffffff",
              size: "md",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            buildRow("ประเภท", typeText),
            buildRow(
              "ยอดเงิน",
              `${ocr.amount?.toLocaleString() ?? "-"} บาท`,
              ocr.type === "INCOME" ? "#27ACB2" : "#E74C3C"
            ),
            buildRow("รายละเอียด", ocr.description),
            buildRow("หมวดหมู่", ocr.category),
            ...(ocr.merchant ? [buildRow("ร้าน/ผู้รับ", ocr.merchant)] : []),
            ...(ocr.date ? [buildRow("วันที่", ocr.date)] : []),
            { type: "separator" as const, margin: "sm" as const },
            {
              type: "text" as const,
              text: confidenceText,
              size: "xs" as const,
              color: confidenceColor,
              margin: "sm" as const,
            },
          ],
        },
        footer: {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#27ACB2",
              label: "✅ ยืนยัน",
              action: {
                type: "postback",
                label: "✅ ยืนยัน",
                data: "action=confirm_expense",
              },
            },
            {
              type: "button",
              style: "secondary",
              label: "❌ ยกเลิก",
              action: {
                type: "postback",
                label: "❌ ยกเลิก",
                data: "action=cancel_expense",
              },
            },
          ],
        },
      },
    } as any);

    logger.debug("OCR confirm message sent", { userId });
  } catch (err) {
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
