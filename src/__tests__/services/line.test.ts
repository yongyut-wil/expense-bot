/**
 * Test สำหรับ LINE Service
 * ทดสอบการส่งข้อความและ format ข้อความ
 */

import {
  replyText,
  formatSummaryMessage,
  formatRecentMessage,
} from "../../services/line";
import { MonthlySummary, RecentExpense } from "../../types";

// Mock LINE client
jest.mock("@line/bot-sdk");

describe("LINE Service", () => {
  describe("replyText", () => {
    it("should send text message successfully", async () => {
      const { lineClient } = require("../../services/line");
      lineClient.replyMessage = jest.fn().mockResolvedValue({});

      await replyText("test-token", "Hello");

      expect(lineClient.replyMessage).toHaveBeenCalledWith("test-token", {
        type: "text",
        text: "Hello",
      });
    });

    it("should throw ExternalServiceError when LINE API fails", async () => {
      const { lineClient } = require("../../services/line");
      lineClient.replyMessage = jest
        .fn()
        .mockRejectedValue(new Error("API error"));

      await expect(replyText("test-token", "Hello")).rejects.toThrow("LINE");
    });
  });

  describe("formatSummaryMessage", () => {
    it("should format summary with positive balance", () => {
      const summary: MonthlySummary = {
        totalIncome: 30000,
        totalExpense: 10000,
        balance: 20000,
        byCategory: [
          { category: "อาหาร", total: 5000 },
          { category: "เดินทาง", total: 3000 },
          { category: "ช็อปปิ้ง", total: 2000 },
        ],
      };

      const message = formatSummaryMessage(summary);

      expect(message).toContain("📊 สรุปรายรับ-รายจ่าย");
      expect(message).toContain("💰 รายรับ: 30,000 บาท");
      expect(message).toContain("💸 รายจ่าย: 10,000 บาท");
      expect(message).toContain("✅ คงเหลือ: 20,000 บาท");
      expect(message).toContain("อาหาร: 5,000 บาท");
      expect(message).toContain("เดินทาง: 3,000 บาท");
      expect(message).toContain("ช็อปปิ้ง: 2,000 บาท");
    });

    it("should format summary with negative balance", () => {
      const summary: MonthlySummary = {
        totalIncome: 10000,
        totalExpense: 15000,
        balance: -5000,
        byCategory: [{ category: "อาหาร", total: 15000 }],
      };

      const message = formatSummaryMessage(summary);

      expect(message).toContain("⚠️ คงเหลือ: -5,000 บาท");
    });

    it("should format summary with no categories", () => {
      const summary: MonthlySummary = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        byCategory: [],
      };

      const message = formatSummaryMessage(summary);

      expect(message).toContain("(ยังไม่มีรายการ)");
    });

    it("should include Thai month name", () => {
      const summary: MonthlySummary = {
        totalIncome: 5000,
        totalExpense: 3000,
        balance: 2000,
        byCategory: [],
      };

      const message = formatSummaryMessage(summary);

      // ตรวจว่ามีชื่อเดือนไทย (มกราคม-ธันวาคม)
      const thaiMonths = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ];

      const hasThaiMonth = thaiMonths.some((month) => message.includes(month));
      expect(hasThaiMonth).toBe(true);
    });
  });

  describe("formatRecentMessage", () => {
    it("should format list of recent expenses", () => {
      const items: RecentExpense[] = [
        {
          description: "กินข้าว",
          amount: 120,
          type: "EXPENSE",
          category: "อาหาร",
          date: new Date("2026-03-23"),
        },
        {
          description: "ค่ารถ",
          amount: 50,
          type: "EXPENSE",
          category: "เดินทาง",
          date: new Date("2026-03-22"),
        },
        {
          description: "เงินเดือน",
          amount: 30000,
          type: "INCOME",
          category: "เงินเดือน",
          date: new Date("2026-03-21"),
        },
      ];

      const message = formatRecentMessage(items);

      expect(message).toContain("5 รายการล่าสุด:");
      expect(message).toContain("💸 กินข้าว — 120 บาท");
      expect(message).toContain("💸 ค่ารถ — 50 บาท");
      expect(message).toContain("💰 เงินเดือน — 30,000 บาท");
    });

    it("should show different emoji for income and expense", () => {
      const items: RecentExpense[] = [
        {
          description: "รายจ่าย",
          amount: 100,
          type: "EXPENSE",
          category: "อื่นๆ",
          date: new Date(),
        },
        {
          description: "รายรับ",
          amount: 200,
          type: "INCOME",
          category: "อื่นๆ",
          date: new Date(),
        },
      ];

      const message = formatRecentMessage(items);

      expect(message).toContain("💸 รายจ่าย");
      expect(message).toContain("💰 รายรับ");
    });

    it("should return friendly message when no items", () => {
      const message = formatRecentMessage([]);

      expect(message).toBe("ยังไม่มีรายการค่ะ 😊");
    });

    it("should format amounts with thousand separators", () => {
      const items: RecentExpense[] = [
        {
          description: "ซื้อของ",
          amount: 12500,
          type: "EXPENSE",
          category: "ช็อปปิ้ง",
          date: new Date(),
        },
      ];

      const message = formatRecentMessage(items);

      expect(message).toContain("12,500 บาท");
    });
  });
});
