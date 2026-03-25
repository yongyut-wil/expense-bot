import { PostbackEvent } from "@line/bot-sdk";
import { getPending, deletePending } from "../services/pendingStore";
import { saveExpense } from "../services/expense";
import { replyText } from "../services/line";
import { logger } from "../utils/logger";

export async function handlePostback(event: PostbackEvent) {
  const userId = event.source.userId!;
  const replyToken = event.replyToken;
  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");

  logger.info("Postback received", { userId, action });

  if (action === "confirm_expense") {
    const pending = getPending(userId);

    if (!pending) {
      return replyText(
        replyToken,
        "หมดเวลายืนยันแล้วค่ะ (5 นาที) 😅\nลองส่งรูปใหม่อีกครั้งนะคะ"
      );
    }

    if (!pending.ocrResult.amount) {
      deletePending(userId);
      return replyText(
        replyToken,
        "ข้อมูลไม่ครบค่ะ ลองส่งรูปใหม่อีกครั้งนะคะ 🙏"
      );
    }

    try {
      await saveExpense(userId, {
        type: pending.ocrResult.type as "INCOME" | "EXPENSE",
        amount: pending.ocrResult.amount,
        description: pending.ocrResult.description,
        category: pending.ocrResult.category,
      });

      deletePending(userId);

      logger.info("Expense confirmed from OCR", {
        userId,
        amount: pending.ocrResult.amount,
        category: pending.ocrResult.category,
      });

      const emoji = pending.ocrResult.type === "INCOME" ? "💰" : "💸";
      const typeText =
        pending.ocrResult.type === "INCOME" ? "รายรับ" : "รายจ่าย";

      return replyText(
        replyToken,
        `${emoji} บันทึก${typeText}แล้วค่ะ!\n📝 ${pending.ocrResult.description}\n💵 ${pending.ocrResult.amount.toLocaleString()} บาท\n🏷️ ${pending.ocrResult.category}`
      );
    } catch (err) {
      logger.error("Failed to save OCR expense", {
        error: (err as Error).message,
      });
      return replyText(replyToken, "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะคะ 🙏");
    }
  }

  if (action === "cancel_expense") {
    deletePending(userId);
    return replyText(
      replyToken,
      "ยกเลิกแล้วค่ะ 👌\nถ้าอยากบันทึกใหม่ ส่งรูปมาได้เลยนะคะ"
    );
  }

  logger.warn("Unknown postback action", { action, userId });
}
