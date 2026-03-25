/**
 * Store for tracking processed transactions to prevent duplicate submissions
 * ใช้ in-memory แต่สามารถเปลี่ยนเป็น Redis ได้เมื่อ scale
 */

const processedTransactions = new Set<string>();

// TTL 10 นาที (เก็บประวัติไว้เผื่อกด retry)
const TTL_MS = 10 * 60 * 1000;
const transactionTimestamps = new Map<string, number>();

export function markTransactionProcessed(transactionId: string): void {
  processedTransactions.add(transactionId);
  transactionTimestamps.set(transactionId, Date.now());
}

export function isTransactionProcessed(transactionId: string): boolean {
  // ตรวจสอบว่า transaction นี้ถูก process ไปแล้วหรือยัง
  if (!processedTransactions.has(transactionId)) {
    return false;
  }

  // ตรวจสอบว่าหมดอายุหรือยัง
  const timestamp = transactionTimestamps.get(transactionId);
  if (!timestamp) {
    processedTransactions.delete(transactionId);
    return false;
  }

  if (Date.now() - timestamp > TTL_MS) {
    // หมดอายุแล้ว ลบออก
    processedTransactions.delete(transactionId);
    transactionTimestamps.delete(transactionId);
    return false;
  }

  return true;
}

// Cleanup expired transactions ทุก 5 นาที
setInterval(
  () => {
    const now = Date.now();
    for (const [txId, timestamp] of transactionTimestamps.entries()) {
      if (now - timestamp > TTL_MS) {
        processedTransactions.delete(txId);
        transactionTimestamps.delete(txId);
      }
    }
  },
  5 * 60 * 1000
);
