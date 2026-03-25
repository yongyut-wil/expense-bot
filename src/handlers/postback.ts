import { PostbackEvent } from "@line/bot-sdk";
import { getPending, deletePending } from "../services/pendingStore";
import { saveExpense } from "../services/expense";
import { replyText, sendExpenseSuccessMessage } from "../services/line";
import { logger } from "../utils/logger";
import {
  isTransactionProcessed,
  markTransactionProcessed,
} from "../services/transactionStore";

export async function handlePostback(event: PostbackEvent) {
  const userId = event.source.userId!;
  const replyToken = event.replyToken;
  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");

  logger.info("Postback received", { userId, action });

  if (action === "confirm_expense") {
    // อ่านข้อมูลจาก postback data แทน in-memory store
    const type = params.get("type");
    const amountStr = params.get("amount");
    const description = params.get("description");
    const category = params.get("category");
    const txId = params.get("txId");

    // Validate ข้อมูล
    if (!type || !amountStr || !description || !category || !txId) {
      return replyText(replyToken, "ข้อมูลไม่ครบค่ะ ลองส่งใหม่อีกครั้งนะคะ 🙏");
    }

    // ตรวจสอบว่า transaction นี้ถูก process ไปแล้วหรือยัง
    if (isTransactionProcessed(txId)) {
      logger.warn("Duplicate transaction detected", { txId, userId });
      return replyText(
        replyToken,
        "รายการนี้ถูกดำเนินการไปแล้วค่ะ (อาจถูกบันทึกหรือยกเลิกไปแล้ว)"
      );
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return replyText(
        replyToken,
        "จำนวนเงินไม่ถูกต้องค่ะ ลองส่งใหม่อีกครั้งนะคะ 🙏"
      );
    }

    try {
      await saveExpense(userId, {
        type: type as "INCOME" | "EXPENSE",
        amount,
        description: decodeURIComponent(description),
        category: decodeURIComponent(category),
      });

      // Mark transaction เป็น processed
      markTransactionProcessed(txId);

      // ลบ pending ถ้ามี (สำหรับกรณี OCR)
      deletePending(userId);

      logger.info("Expense confirmed from postback", {
        userId,
        amount,
        category: decodeURIComponent(category),
        txId,
      });

      return sendExpenseSuccessMessage(replyToken, {
        type,
        amount,
        description: decodeURIComponent(description),
        category: decodeURIComponent(category),
      });
    } catch (err) {
      logger.error("Failed to save expense", {
        error: (err as Error).message,
      });
      return replyText(replyToken, "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะคะ 🙏");
    }
  }

  if (action === "cancel_expense") {
    const txId = params.get("txId");

    // Mark transaction เป็น processed (แม้จะยกเลิก)
    if (txId) {
      if (isTransactionProcessed(txId)) {
        logger.warn("Duplicate cancel transaction detected", { txId, userId });
        return replyText(
          replyToken,
          "รายการนี้ถูกดำเนินการไปแล้วค่ะ (อาจถูกบันทึกหรือยกเลิกไปแล้ว)"
        );
      }
      markTransactionProcessed(txId);
      logger.info("Transaction cancelled", { userId, txId });
    }

    deletePending(userId);
    return replyText(
      replyToken,
      "ยกเลิกแล้วค่ะ\nถ้าอยากบันทึกใหม่ ส่งข้อมูลมาได้เลยนะคะ"
    );
  }

  logger.warn("Unknown postback action", { action, userId });
}
