/**
 * Test สำหรับ Webhook Handler
 * ทดสอบการรับและประมวลผล webhook จาก LINE
 */

import { Request, Response } from "express";
import { webhookHandler } from "../../handlers/message";

// Mock services ทั้งหมด
jest.mock("../../services/index");
jest.mock("../../services/expense");
jest.mock("../../services/line");

import { parseExpenseMessage } from "../../services/index";
import {
  saveExpense,
  getMonthlySummary,
  getRecentExpenses,
} from "../../services/expense";
import {
  replyText,
  formatSummaryMessage,
  formatRecentMessage,
} from "../../services/line";

const mockParseExpense = parseExpenseMessage as jest.MockedFunction<typeof parseExpenseMessage>;
const mockSaveExpense = saveExpense as jest.MockedFunction<typeof saveExpense>;
const mockGetSummary = getMonthlySummary as jest.MockedFunction<typeof getMonthlySummary>;
const mockGetRecent = getRecentExpenses as jest.MockedFunction<typeof getRecentExpenses>;
const mockReplyText = replyText as jest.MockedFunction<typeof replyText>;
const mockFormatSummary = formatSummaryMessage as jest.MockedFunction<typeof formatSummaryMessage>;
const mockFormatRecent = formatRecentMessage as jest.MockedFunction<typeof formatRecentMessage>;

// Helper สร้าง mock request
function makeRequest(text: string, userId = "U1234567890"): Partial<Request> {
  return {
    body: {
      events: [
        {
          type: "message",
          replyToken: "reply-token-123",
          source: { userId, type: "user" },
          message: { type: "text", text },
        },
      ],
    },
  };
}

// Helper สร้าง mock response
function makeResponse(): Partial<Response> {
  return {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };
}

describe("Webhook Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReplyText.mockResolvedValue({} as any);
    mockSaveExpense.mockResolvedValue({} as any);
  });

  // รอให้ async processing เสร็จหลัง res.json()
  async function waitForAsync() {
    await new Promise((r) => setTimeout(r, 100));
  }

  describe("Validation", () => {
    it("should throw ValidationError when payload is invalid", async () => {
      const req = { body: { invalid: "payload" } } as Request;
      const res = makeResponse() as Response;

      await expect(webhookHandler(req, res)).rejects.toThrow();
    });

    it("should return ok immediately", async () => {
      const req = makeRequest("กินข้าว 120") as Request;
      const res = makeResponse() as Response;

      mockParseExpense.mockResolvedValue({
        type: "EXPENSE",
        amount: 120,
        description: "ค่าอาหาร",
        category: "อาหาร",
      });

      await webhookHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({ status: "ok" });
    });
  });

  describe("Commands", () => {
    it("should reply with summary when user sends 'สรุป'", async () => {
      const req = makeRequest("สรุป") as Request;
      const res = makeResponse() as Response;

      mockGetSummary.mockResolvedValue({
        totalIncome: 30000,
        totalExpense: 5000,
        balance: 25000,
        byCategory: [],
      });
      mockFormatSummary.mockReturnValue("📊 สรุปเดือนนี้...");

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockGetSummary).toHaveBeenCalledWith("U1234567890");
      expect(mockReplyText).toHaveBeenCalledWith(
        "reply-token-123",
        "📊 สรุปเดือนนี้..."
      );
    });

    it("should reply with recent when user sends 'ล่าสุด'", async () => {
      const req = makeRequest("ล่าสุด") as Request;
      const res = makeResponse() as Response;

      mockGetRecent.mockResolvedValue([]);
      mockFormatRecent.mockReturnValue("ยังไม่มีรายการค่ะ 😊");

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockGetRecent).toHaveBeenCalledWith("U1234567890");
      expect(mockReplyText).toHaveBeenCalledWith(
        "reply-token-123",
        "ยังไม่มีรายการค่ะ 😊"
      );
    });

    it("should reply with help text when user sends 'วิธีใช้'", async () => {
      const req = makeRequest("วิธีใช้") as Request;
      const res = makeResponse() as Response;

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockReplyText).toHaveBeenCalledWith(
        "reply-token-123",
        expect.stringContaining("วิธีใช้")
      );
    });
  });

  describe("Expense Parsing", () => {
    it("should save expense and reply when valid message", async () => {
      const req = makeRequest("กินข้าว 120") as Request;
      const res = makeResponse() as Response;

      mockParseExpense.mockResolvedValue({
        type: "EXPENSE",
        amount: 120,
        description: "ค่าอาหาร",
        category: "อาหาร",
      });

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockSaveExpense).toHaveBeenCalledWith(
        "U1234567890",
        expect.objectContaining({ type: "EXPENSE", amount: 120 })
      );
      expect(mockReplyText).toHaveBeenCalledWith(
        "reply-token-123",
        expect.stringContaining("บันทึก")
      );
    });

    it("should save income correctly", async () => {
      const req = makeRequest("รับเงิน 5000") as Request;
      const res = makeResponse() as Response;

      mockParseExpense.mockResolvedValue({
        type: "INCOME",
        amount: 5000,
        description: "รับเงิน",
        category: "เงินเดือน",
      });

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockSaveExpense).toHaveBeenCalledWith(
        "U1234567890",
        expect.objectContaining({ type: "INCOME", amount: 5000 })
      );
      expect(mockReplyText).toHaveBeenCalledWith(
        "reply-token-123",
        expect.stringContaining("บันทึก")
      );
    });

    it("should reply error message when parsed type is UNKNOWN", async () => {
      const req = makeRequest("สวัสดีครับ") as Request;
      const res = makeResponse() as Response;

      mockParseExpense.mockResolvedValue({
        type: "UNKNOWN",
        amount: null,
        description: "สวัสดีครับ",
        category: "อื่นๆ",
      });

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockSaveExpense).not.toHaveBeenCalled();
      expect(mockReplyText).toHaveBeenCalledWith(
        "reply-token-123",
        expect.stringContaining("ไม่เข้าใจ")
      );
    });

    it("should reply error message when service throws", async () => {
      const req = makeRequest("กินข้าว 100") as Request;
      const res = makeResponse() as Response;

      mockParseExpense.mockRejectedValue(new Error("AI timeout"));

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockReplyText).toHaveBeenCalledWith(
        "reply-token-123",
        expect.stringContaining("ผิดพลาด")
      );
    });
  });

  describe("Edge Cases", () => {
    it("should skip non-message events", async () => {
      const req = {
        body: {
          events: [{ 
            type: "follow", 
            source: { userId: "U1234567890", type: "user" } 
          }],
        },
      } as Request;
      const res = makeResponse() as Response;

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockReplyText).not.toHaveBeenCalled();
    });

    it("should skip events without userId", async () => {
      const req = {
        body: {
          events: [
            {
              type: "message",
              replyToken: "token",
              source: { type: "group" },
              message: { type: "text", text: "กินข้าว 100" },
            },
          ],
        },
      } as Request;
      const res = makeResponse() as Response;

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockReplyText).not.toHaveBeenCalled();
    });

    it("should skip non-text messages", async () => {
      const req = {
        body: {
          events: [
            {
              type: "message",
              replyToken: "token",
              source: { userId: "U1234567890", type: "user" },
              message: { type: "sticker", packageId: "1", stickerId: "1" },
            },
          ],
        },
      } as Request;
      const res = makeResponse() as Response;

      await webhookHandler(req, res);
      await waitForAsync();

      expect(mockParseExpense).not.toHaveBeenCalled();
    });

    it("should handle empty events array", async () => {
      const req = { body: { events: [] } } as Request;
      const res = makeResponse() as Response;

      await webhookHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({ status: "ok" });
    });
  });
});
