/**
 * Test สำหรับ Fallback Parser
 * ทดสอบ regex-based parser ที่ใช้เมื่อ AI ล้มเหลว
 */

import { parseFallback } from "../../services/fallback";

describe("Fallback Parser", () => {
  describe("Amount extraction", () => {
    it("should extract integer amount", () => {
      const result = parseFallback("กินข้าว 120");
      expect(result.amount).toBe(120);
    });

    it("should extract decimal amount", () => {
      const result = parseFallback("ค่ากาแฟ 45.50");
      expect(result.amount).toBe(45.5);
    });

    it("should extract amount with comma", () => {
      const result = parseFallback("เงินเดือน 30,000");
      expect(result.amount).toBe(30000);
    });

    it("should return null when no amount found", () => {
      const result = parseFallback("สวัสดีครับ");
      expect(result.amount).toBeNull();
      expect(result.type).toBe("UNKNOWN");
    });
  });

  describe("Income detection", () => {
    it("should detect 'รับ' keyword", () => {
      const result = parseFallback("รับเงิน 5000");
      expect(result.type).toBe("INCOME");
    });

    it("should detect 'ได้' keyword", () => {
      const result = parseFallback("ได้เงินเดือน 30000");
      expect(result.type).toBe("INCOME");
    });

    it("should detect 'โบนัส' keyword", () => {
      const result = parseFallback("โบนัสปีใหม่ 10000");
      expect(result.type).toBe("INCOME");
    });

    it("should default to EXPENSE when no income keyword", () => {
      const result = parseFallback("กินข้าว 100");
      expect(result.type).toBe("EXPENSE");
    });
  });

  describe("Category detection", () => {
    it("should categorize food expenses", () => {
      expect(parseFallback("กินข้าว 100").category).toBe("อาหาร");
      expect(parseFallback("ซื้ออาหาร 200").category).toBe("อาหาร");
      expect(parseFallback("กาแฟ 50").category).toBe("อาหาร");
    });

    it("should categorize transportation", () => {
      expect(parseFallback("ค่ารถ 50").category).toBe("เดินทาง");
      expect(parseFallback("bts 44").category).toBe("เดินทาง");
      expect(parseFallback("แท็กซี่ 100").category).toBe("เดินทาง");
    });

    it("should categorize shopping", () => {
      expect(parseFallback("ซื้อของ 500").category).toBe("ช็อปปิ้ง");
      expect(parseFallback("เสื้อผ้า 1000").category).toBe("ช็อปปิ้ง");
    });

    it("should default to 'อื่นๆ' when no keyword matches", () => {
      const result = parseFallback("จ่ายค่าอะไรไม่รู้ 300");
      expect(result.category).toBe("อื่นๆ");
    });
  });

  describe("Description extraction", () => {
    it("should use full text as description", () => {
      const result = parseFallback("กินข้าวกลางวันที่ร้านอร่อย 120");
      expect(result.description).toBe("กินข้าวกลางวันที่ร้านอร่อย 120");
    });

    it("should preserve original message", () => {
      const text = "ค่าเดินทาง BTS 44 บาท";
      const result = parseFallback(text);
      expect(result.description).toBe(text);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string", () => {
      const result = parseFallback("");
      expect(result.type).toBe("UNKNOWN");
      expect(result.amount).toBeNull();
    });

    it("should handle only numbers", () => {
      const result = parseFallback("500");
      expect(result.amount).toBe(500);
      expect(result.type).toBe("EXPENSE");
    });

    it("should handle Thai and English mixed", () => {
      const result = parseFallback("Grab taxi 150");
      expect(result.amount).toBe(150);
      expect(result.category).toBe("เดินทาง");
    });

    it("should handle multiple numbers (use first one)", () => {
      const result = parseFallback("กินข้าว 100 บาท รวม 120");
      expect(result.amount).toBe(100);
    });
  });
});
