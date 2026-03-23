import { Client } from "@line/bot-sdk";
import { config } from "../config";
import { logger } from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";
import { MonthlySummary, RecentExpense } from "../types";

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