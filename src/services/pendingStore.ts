import { PendingConfirmation, OcrResult } from "../types";
import { logger } from "../utils/logger";

const store = new Map<string, PendingConfirmation>();

// หมดอายุหลัง 5 นาที
const TTL_MS = 5 * 60 * 1000;

export function setPending(
  userId: string,
  data: { ocrResult: OcrResult; imageMessageId: string }
) {
  store.set(userId, { ...data, userId, createdAt: new Date() });
  logger.debug("Pending confirmation set", { userId });
}

export function getPending(userId: string): PendingConfirmation | null {
  const pending = store.get(userId);
  if (!pending) return null;

  if (Date.now() - pending.createdAt.getTime() > TTL_MS) {
    store.delete(userId);
    logger.debug("Pending confirmation expired", { userId });
    return null;
  }

  return pending;
}

export function deletePending(userId: string) {
  store.delete(userId);
  logger.debug("Pending confirmation deleted", { userId });
}

// Cleanup ทุก 10 นาที ป้องกัน memory leak
setInterval(
  () => {
    const now = Date.now();
    let cleaned = 0;
    for (const [userId, pending] of store.entries()) {
      if (now - pending.createdAt.getTime() > TTL_MS) {
        store.delete(userId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cleaned ${cleaned} expired pending confirmations`);
    }
  },
  10 * 60 * 1000
);
