/**
 * Test สำหรับ parseExpenseMessage integration
 * Note: เนื่องจาก parseExpenseMessage ใช้ Google AI จริงและมี fallback
 * การ test แบบ unit จึงซับซ้อน - ควรทดสอบ GoogleProvider และ fallback แยก
 *
 * Test suite นี้ทดสอบ fallback behavior เมื่อ AI fail
 */

import { parseFallback } from "../../services/fallback";

describe("parseExpenseMessage (Fallback Behavior)", () => {
  describe("When fallback parser is used", () => {
    it("should parse expense correctly", async () => {
      const result = parseFallback("กินข้าว 100");

      expect(result.amount).toBe(100);
      expect(result.type).toBe("EXPENSE");
      expect(result.category).toBe("อาหาร");
    });

    it("should detect income from keywords", async () => {
      const result = parseFallback("รับเงิน 5000");

      expect(result.type).toBe("INCOME");
      expect(result.amount).toBe(5000);
    });

    it("should categorize based on keywords", async () => {
      const result = parseFallback("กินข้าว 120");

      expect(result.category).toBe("อาหาร");
      expect(result.amount).toBe(120);
    });

    it("should handle no amount in message", async () => {
      const result = parseFallback("สวัสดีครับ");

      expect(result.type).toBe("UNKNOWN");
      expect(result.amount).toBeNull();
    });
  });
});
