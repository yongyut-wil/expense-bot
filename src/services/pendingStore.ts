import { PendingConfirmation, OcrResult, ParsedExpense } from "../types";
import { logger } from "../utils/logger";

const store = new Map<string, PendingConfirmation>();

// หมดอายุหลัง 5 นาที
const TTL_MS = 5 * 60 * 1000;

export function setPending(
  txId: string,
  userId: string,
  data:
    | { ocrResult: OcrResult; imageMessageId: string }
    | { parsedExpense: ParsedExpense }
) {
  store.set(txId, { ...data, userId, createdAt: new Date() });
  logger.debug("Pending confirmation set", { txId, userId });
}

export function getPending(txId: string): PendingConfirmation | null {
  const pending = store.get(txId);
  if (!pending) return null;

  if (Date.now() - pending.createdAt.getTime() > TTL_MS) {
    store.delete(txId);
    logger.debug("Pending confirmation expired", { txId });
    return null;
  }

  return pending;
}

export function deletePending(txId: string) {
  store.delete(txId);
  logger.debug("Pending confirmation deleted", { txId });
}

// Cleanup ทุก 10 นาที ป้องกัน memory leak
setInterval(
  () => {
    const now = Date.now();
    let cleaned = 0;
    for (const [txId, pending] of store.entries()) {
      if (now - pending.createdAt.getTime() > TTL_MS) {
        store.delete(txId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cleaned ${cleaned} expired pending confirmations`);
    }
  },
  10 * 60 * 1000
);
