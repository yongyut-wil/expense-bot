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

export async function sendExpenseConfirmMessage(
  userId: string,
  expense: {
    type: string;
    amount: number;
    description: string;
    category: string;
  }
): Promise<void> {
  const isIncome = expense.type === "INCOME";
  const headerColor = isIncome ? "#27ACB2" : "#FF6B6B";
  const amountColor = isIncome ? "#27ACB2" : "#E74C3C";
  const typeIcon = isIncome ? "💰" : "💸";
  const typeText = isIncome ? "รายรับ" : "รายจ่าย";

  const flexMessage = {
    type: "flex" as const,
    altText: `ยืนยันการบันทึก ${expense.amount?.toLocaleString()} บาท?`,
    contents: {
      type: "bubble" as const,
      header: {
        type: "box" as const,
        layout: "vertical" as const,
        backgroundColor: headerColor,
        paddingAll: "md" as const,
        contents: [
          {
            type: "text" as const,
            text: "📋 ยืนยันการบันทึก",
            weight: "bold" as const,
            color: "#ffffff",
            size: "md" as const,
          },
        ],
      },
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "md" as const,
        contents: [
          {
            type: "box" as const,
            layout: "horizontal" as const,
            contents: [
              {
                type: "text" as const,
                text: "ประเภท",
                color: "#888888",
                size: "sm" as const,
                flex: 2,
              },
              {
                type: "text" as const,
                text: `${typeIcon} ${typeText}`,
                weight: "bold" as const,
                size: "sm" as const,
                flex: 3,
                align: "end" as const,
              },
            ],
          },
          {
            type: "box" as const,
            layout: "horizontal" as const,
            contents: [
              {
                type: "text" as const,
                text: "ยอดเงิน",
                color: "#888888",
                size: "sm" as const,
                flex: 2,
              },
              {
                type: "text" as const,
                text: `${expense.amount?.toLocaleString() ?? "-"} บาท`,
                weight: "bold" as const,
                size: "xl" as const,
                color: amountColor,
                flex: 3,
                align: "end" as const,
              },
            ],
          },
          { type: "separator" as const, margin: "md" as const },
          {
            type: "box" as const,
            layout: "vertical" as const,
            margin: "md" as const,
            spacing: "sm" as const,
            contents: [
              {
                type: "text" as const,
                text: "รายละเอียด",
                color: "#888888",
                size: "xs" as const,
              },
              {
                type: "text" as const,
                text: expense.description,
                size: "sm" as const,
                wrap: true,
                color: "#111111",
              },
            ],
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            margin: "sm" as const,
            spacing: "sm" as const,
            contents: [
              {
                type: "text" as const,
                text: "หมวดหมู่",
                color: "#888888",
                size: "xs" as const,
              },
              {
                type: "text" as const,
                text: `🏷️ ${expense.category}`,
                size: "sm" as const,
                color: "#111111",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box" as const,
        layout: "horizontal" as const,
        spacing: "sm" as const,
        contents: [
          {
            type: "button" as const,
            style: "primary" as const,
            color: headerColor,
            action: {
              type: "postback" as const,
              label: "✅ ยืนยัน",
              data: "action=confirm_expense",
            },
            flex: 1,
          },
          {
            type: "button" as const,
            style: "link" as const,
            action: {
              type: "postback" as const,
              label: "❌ ยกเลิก",
              data: "action=cancel_expense",
            },
            flex: 1,
          },
        ],
      },
    },
  };

  try {
    await lineClient.pushMessage(userId, flexMessage);
    logger.debug("Expense confirm message sent", { userId });
  } catch (err) {
    const errorResponse = (err as any)?.response;
    const errorDetails = {
      message: (err as Error).message,
      status: errorResponse?.status,
      statusText: errorResponse?.statusText,
      data: errorResponse?.data,
      headers: errorResponse?.headers,
    };
    logger.error("Failed to send expense confirm message", {
      error: (err as Error).message,
      fullError: JSON.stringify(errorDetails, null, 2),
    });
    throw new ExternalServiceError("LINE", (err as Error).message);
  }
}

export async function sendOcrConfirmMessage(
  userId: string,
  ocr: OcrResult
): Promise<void> {
  const isIncome = ocr.type === "INCOME";
  const headerColor = isIncome ? "#27ACB2" : "#FF6B6B";
  const amountColor = isIncome ? "#27ACB2" : "#E74C3C";
  const typeIcon = isIncome ? "💰" : "💸";
  const typeText = isIncome ? "รายรับ" : "รายจ่าย";

  const confidenceColor = {
    high: "#27ACB2",
    medium: "#F39C12",
    low: "#E74C3C",
  }[ocr.confidence];

  const confidenceText = {
    high: "✅ มั่นใจสูง",
    medium: "⚠️ มั่นใจปานกลาง",
    low: "❓ มั่นใจต่ำ",
  }[ocr.confidence];

  const bodyContents: any[] = [
    {
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        {
          type: "text" as const,
          text: "ประเภท",
          color: "#888888",
          size: "sm" as const,
          flex: 2,
        },
        {
          type: "text" as const,
          text: `${typeIcon} ${typeText}`,
          weight: "bold" as const,
          size: "sm" as const,
          flex: 3,
          align: "end" as const,
        },
      ],
    },
    {
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        {
          type: "text" as const,
          text: "ยอดเงิน",
          color: "#888888",
          size: "sm" as const,
          flex: 2,
        },
        {
          type: "text" as const,
          text: `${ocr.amount?.toLocaleString() ?? "-"} บาท`,
          weight: "bold" as const,
          size: "xl" as const,
          color: amountColor,
          flex: 3,
          align: "end" as const,
        },
      ],
    },
    { type: "separator" as const, margin: "md" as const },
    {
      type: "box" as const,
      layout: "vertical" as const,
      margin: "md" as const,
      spacing: "sm" as const,
      contents: [
        {
          type: "text" as const,
          text: "รายละเอียด",
          color: "#888888",
          size: "xs" as const,
        },
        {
          type: "text" as const,
          text: ocr.description,
          size: "sm" as const,
          wrap: true,
          color: "#111111",
        },
      ],
    },
    {
      type: "box" as const,
      layout: "vertical" as const,
      margin: "sm" as const,
      spacing: "sm" as const,
      contents: [
        {
          type: "text" as const,
          text: "หมวดหมู่",
          color: "#888888",
          size: "xs" as const,
        },
        {
          type: "text" as const,
          text: `🏷️ ${ocr.category}`,
          size: "sm" as const,
          color: "#111111",
        },
      ],
    },
  ];

  if (ocr.merchant) {
    bodyContents.push({
      type: "box" as const,
      layout: "vertical" as const,
      margin: "sm" as const,
      spacing: "sm" as const,
      contents: [
        {
          type: "text" as const,
          text: "ร้านค้า/ผู้รับ",
          color: "#888888",
          size: "xs" as const,
        },
        {
          type: "text" as const,
          text: `🏪 ${ocr.merchant}`,
          size: "sm" as const,
          color: "#111111",
        },
      ],
    });
  }

  if (ocr.date) {
    bodyContents.push({
      type: "box" as const,
      layout: "vertical" as const,
      margin: "sm" as const,
      spacing: "sm" as const,
      contents: [
        {
          type: "text" as const,
          text: "วันที่",
          color: "#888888",
          size: "xs" as const,
        },
        {
          type: "text" as const,
          text: `📅 ${ocr.date}`,
          size: "sm" as const,
          color: "#111111",
        },
      ],
    });
  }

  bodyContents.push(
    { type: "separator" as const, margin: "md" as const },
    {
      type: "box" as const,
      layout: "horizontal" as const,
      margin: "md" as const,
      contents: [
        {
          type: "text" as const,
          text: "ความแม่นยำ OCR",
          color: "#888888",
          size: "xs" as const,
          flex: 2,
        },
        {
          type: "text" as const,
          text: confidenceText,
          size: "xs" as const,
          color: confidenceColor,
          weight: "bold" as const,
          flex: 3,
          align: "end" as const,
        },
      ],
    }
  );

  const flexMessage = {
    type: "flex" as const,
    altText: `ยืนยันการบันทึก ${ocr.amount?.toLocaleString()} บาท?`,
    contents: {
      type: "bubble" as const,
      header: {
        type: "box" as const,
        layout: "vertical" as const,
        backgroundColor: headerColor,
        paddingAll: "md" as const,
        contents: [
          {
            type: "text" as const,
            text: "📸 ตรวจสอบข้อมูลจากสลิป",
            weight: "bold" as const,
            color: "#ffffff",
            size: "md" as const,
          },
        ],
      },
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "md" as const,
        contents: bodyContents,
      },
      footer: {
        type: "box" as const,
        layout: "horizontal" as const,
        spacing: "sm" as const,
        contents: [
          {
            type: "button" as const,
            style: "primary" as const,
            color: headerColor,
            action: {
              type: "postback" as const,
              label: "✅ ยืนยัน",
              data: "action=confirm_expense",
            },
            flex: 1,
          },
          {
            type: "button" as const,
            style: "link" as const,
            action: {
              type: "postback" as const,
              label: "❌ ยกเลิก",
              data: "action=cancel_expense",
            },
            flex: 1,
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
