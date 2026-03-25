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
  const headerColor = isIncome ? "#4A7C59" : "#8B4049";
  const amountColor = isIncome ? "#4A7C59" : "#E85D75";
  const typeIcon = isIncome ? "💰" : "💸";
  const typeText = isIncome ? "รายรับ" : "รายจ่าย";
  const typeBadgeColor = isIncome ? "#D4EDDA" : "#F8D7DA";
  const categoryBadgeColor = "#D6E9F8";

  const flexMessage = {
    type: "flex" as const,
    altText: `ยืนยันการบันทึก ${expense.amount?.toLocaleString()} บาท?`,
    contents: {
      type: "bubble" as const,
      header: {
        type: "box" as const,
        layout: "horizontal" as const,
        backgroundColor: headerColor,
        paddingAll: "lg" as const,
        contents: [
          {
            type: "text" as const,
            text: "ยืนยันการบันทึก",
            weight: "bold" as const,
            color: "#ffffff",
            size: "md" as const,
            flex: 1,
          },
          {
            type: "text" as const,
            text: "🗑️",
            size: "md" as const,
            align: "end" as const,
          },
        ],
      },
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "lg" as const,
        paddingAll: "lg" as const,
        contents: [
          {
            type: "box" as const,
            layout: "horizontal" as const,
            spacing: "md" as const,
            contents: [
              {
                type: "box" as const,
                layout: "vertical" as const,
                flex: 1,
                spacing: "xs" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: "TYPE",
                    color: "#999999",
                    size: "xs" as const,
                  },
                  {
                    type: "box" as const,
                    layout: "horizontal" as const,
                    backgroundColor: typeBadgeColor,
                    cornerRadius: "md" as const,
                    paddingAll: "sm" as const,
                    contents: [
                      {
                        type: "text" as const,
                        text: `${typeIcon} ${typeText}`,
                        size: "sm" as const,
                        weight: "bold" as const,
                        color: headerColor,
                        align: "center" as const,
                      },
                    ],
                  },
                ],
              },
              {
                type: "box" as const,
                layout: "vertical" as const,
                flex: 1,
                spacing: "xs" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: "CATEGORY",
                    color: "#999999",
                    size: "xs" as const,
                    align: "end" as const,
                  },
                  {
                    type: "box" as const,
                    layout: "horizontal" as const,
                    backgroundColor: categoryBadgeColor,
                    cornerRadius: "md" as const,
                    paddingAll: "sm" as const,
                    contents: [
                      {
                        type: "text" as const,
                        text: `🏷️ ${expense.category}`,
                        size: "sm" as const,
                        weight: "bold" as const,
                        color: "#1E5A8E",
                        align: "center" as const,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "xs" as const,
            margin: "lg" as const,
            contents: [
              {
                type: "text" as const,
                text: "TOTAL AMOUNT",
                color: "#999999",
                size: "xs" as const,
                align: "center" as const,
              },
              {
                type: "box" as const,
                layout: "baseline" as const,
                spacing: "xs" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: expense.amount.toLocaleString(),
                    size: "4xl" as const,
                    weight: "bold" as const,
                    color: amountColor,
                    align: "center" as const,
                    flex: 0,
                  },
                  {
                    type: "text" as const,
                    text: "บาท",
                    size: "md" as const,
                    color: amountColor,
                    flex: 0,
                    margin: "sm" as const,
                  },
                ],
              },
            ],
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
            margin: "lg" as const,
            backgroundColor: "#F5F5F5",
            cornerRadius: "md" as const,
            paddingAll: "md" as const,
            contents: [
              {
                type: "text" as const,
                text: "DESCRIPTION",
                color: "#999999",
                size: "xs" as const,
              },
              {
                type: "text" as const,
                text: expense.description,
                size: "sm" as const,
                wrap: true,
                color: "#333333",
                weight: "bold" as const,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "sm" as const,
        paddingAll: "lg" as const,
        contents: [
          {
            type: "button" as const,
            style: "primary" as const,
            color: "#22A699",
            height: "sm" as const,
            action: {
              type: "postback" as const,
              label: "✓ ยืนยัน",
              data: "action=confirm_expense",
            },
          },
          {
            type: "button" as const,
            style: "link" as const,
            height: "sm" as const,
            action: {
              type: "postback" as const,
              label: "✕ ยกเลิก",
              data: "action=cancel_expense",
            },
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
  const headerColor = isIncome ? "#4A7C59" : "#8B4049";
  const amountColor = isIncome ? "#4A7C59" : "#E85D75";
  const typeIcon = isIncome ? "💰" : "💸";
  const typeText = isIncome ? "รายรับ" : "รายจ่าย";
  const typeBadgeColor = isIncome ? "#D4EDDA" : "#F8D7DA";
  const categoryBadgeColor = "#D6E9F8";

  const confidenceColor = {
    high: "#22A699",
    medium: "#F39C12",
    low: "#E85D75",
  }[ocr.confidence];

  const confidenceText = {
    high: "✓ สูง",
    medium: "⚠ ปานกลาง",
    low: "✕ ต่ำ",
  }[ocr.confidence];

  const bodyContents: any[] = [
    {
      type: "box" as const,
      layout: "horizontal" as const,
      spacing: "md" as const,
      contents: [
        {
          type: "box" as const,
          layout: "vertical" as const,
          flex: 1,
          spacing: "xs" as const,
          contents: [
            {
              type: "text" as const,
              text: "TYPE",
              color: "#999999",
              size: "xs" as const,
            },
            {
              type: "box" as const,
              layout: "horizontal" as const,
              backgroundColor: typeBadgeColor,
              cornerRadius: "md" as const,
              paddingAll: "sm" as const,
              contents: [
                {
                  type: "text" as const,
                  text: `${typeIcon} ${typeText}`,
                  size: "sm" as const,
                  weight: "bold" as const,
                  color: headerColor,
                  align: "center" as const,
                },
              ],
            },
          ],
        },
        {
          type: "box" as const,
          layout: "vertical" as const,
          flex: 1,
          spacing: "xs" as const,
          contents: [
            {
              type: "text" as const,
              text: "CATEGORY",
              color: "#999999",
              size: "xs" as const,
              align: "end" as const,
            },
            {
              type: "box" as const,
              layout: "horizontal" as const,
              backgroundColor: categoryBadgeColor,
              cornerRadius: "md" as const,
              paddingAll: "sm" as const,
              contents: [
                {
                  type: "text" as const,
                  text: `🏷️ ${ocr.category}`,
                  size: "sm" as const,
                  weight: "bold" as const,
                  color: "#1E5A8E",
                  align: "center" as const,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "box" as const,
      layout: "vertical" as const,
      spacing: "xs" as const,
      margin: "lg" as const,
      contents: [
        {
          type: "text" as const,
          text: "TOTAL AMOUNT",
          color: "#999999",
          size: "xs" as const,
          align: "center" as const,
        },
        {
          type: "box" as const,
          layout: "baseline" as const,
          spacing: "xs" as const,
          contents: [
            {
              type: "text" as const,
              text: ocr.amount?.toLocaleString() ?? "-",
              size: "4xl" as const,
              weight: "bold" as const,
              color: amountColor,
              align: "center" as const,
              flex: 0,
            },
            {
              type: "text" as const,
              text: "บาท",
              size: "md" as const,
              color: amountColor,
              flex: 0,
              margin: "sm" as const,
            },
          ],
        },
      ],
    },
    {
      type: "box" as const,
      layout: "vertical" as const,
      spacing: "sm" as const,
      margin: "lg" as const,
      backgroundColor: "#F5F5F5",
      cornerRadius: "md" as const,
      paddingAll: "md" as const,
      contents: [
        {
          type: "text" as const,
          text: "DESCRIPTION",
          color: "#999999",
          size: "xs" as const,
        },
        {
          type: "text" as const,
          text: ocr.description,
          size: "sm" as const,
          wrap: true,
          color: "#333333",
          weight: "bold" as const,
        },
      ],
    },
  ];

  if (ocr.merchant || ocr.date) {
    const extraFields: any[] = [];
    if (ocr.merchant) {
      extraFields.push({
        type: "text" as const,
        text: `🏪 ${ocr.merchant}`,
        size: "xs" as const,
        color: "#666666",
      });
    }
    if (ocr.date) {
      extraFields.push({
        type: "text" as const,
        text: `📅 ${ocr.date}`,
        size: "xs" as const,
        color: "#666666",
      });
    }
    bodyContents.push({
      type: "box" as const,
      layout: "vertical" as const,
      spacing: "xs" as const,
      margin: "md" as const,
      contents: extraFields,
    });
  }

  bodyContents.push({
    type: "box" as const,
    layout: "horizontal" as const,
    margin: "md" as const,
    backgroundColor: "#FAFAFA",
    cornerRadius: "sm" as const,
    paddingAll: "sm" as const,
    contents: [
      {
        type: "text" as const,
        text: "ความแม่นยำ OCR",
        color: "#999999",
        size: "xs" as const,
        flex: 1,
      },
      {
        type: "text" as const,
        text: confidenceText,
        size: "xs" as const,
        color: confidenceColor,
        weight: "bold" as const,
        flex: 0,
      },
    ],
  });

  const flexMessage = {
    type: "flex" as const,
    altText: `ยืนยันการบันทึก ${ocr.amount?.toLocaleString()} บาท?`,
    contents: {
      type: "bubble" as const,
      header: {
        type: "box" as const,
        layout: "horizontal" as const,
        backgroundColor: headerColor,
        paddingAll: "lg" as const,
        contents: [
          {
            type: "text" as const,
            text: "📸 ตรวจสอบสลิป",
            weight: "bold" as const,
            color: "#ffffff",
            size: "md" as const,
            flex: 1,
          },
          {
            type: "text" as const,
            text: "🗑️",
            size: "md" as const,
            align: "end" as const,
          },
        ],
      },
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "lg" as const,
        paddingAll: "lg" as const,
        contents: bodyContents,
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "sm" as const,
        paddingAll: "lg" as const,
        contents: [
          {
            type: "button" as const,
            style: "primary" as const,
            color: "#22A699",
            height: "sm" as const,
            action: {
              type: "postback" as const,
              label: "✓ ยืนยัน",
              data: "action=confirm_expense",
            },
          },
          {
            type: "button" as const,
            style: "link" as const,
            height: "sm" as const,
            action: {
              type: "postback" as const,
              label: "✕ ยกเลิก",
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
