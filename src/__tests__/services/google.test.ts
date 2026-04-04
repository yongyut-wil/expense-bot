/**
 * Test สำหรับ Google Gemini AI Provider
 * ทดสอบการ parse ข้อความด้วย Google Gemini AI
 */

import { GoogleProvider } from "../../services/google";
import { GoogleGenerativeAI } from "@google/generative-ai";

jest.mock("@google/generative-ai");

const mockGoogleAI = GoogleGenerativeAI as jest.MockedClass<
  typeof GoogleGenerativeAI
>;

describe("Google AI Provider", () => {
  let provider: GoogleProvider;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGenerateContent = jest.fn();
    mockGoogleAI.mockImplementation(
      () =>
        ({
          getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: mockGenerateContent,
          }),
        }) as any
    );

    provider = new GoogleProvider("test-api-key");
  });

  describe("parseExpense", () => {
    it("should parse expense message successfully", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              type: "EXPENSE",
              amount: 120,
              description: "ค่าอาหาร",
              category: "อาหาร",
            }),
        },
      });

      const result = await provider.parseExpense("กินข้าว 120");

      expect(result).toEqual({
        type: "EXPENSE",
        amount: 120,
        description: "ค่าอาหาร",
        category: "อาหาร",
      });
    });

    it("should parse income message successfully", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              type: "INCOME",
              amount: 30000,
              description: "เงินเดือน",
              category: "เงินเดือน",
            }),
        },
      });

      const result = await provider.parseExpense("รับเงินเดือน 30000");

      expect(result).toEqual({
        type: "INCOME",
        amount: 30000,
        description: "เงินเดือน",
        category: "เงินเดือน",
      });
    });

    it("should return UNKNOWN when AI returns invalid JSON", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "not valid json {{",
        },
      });

      const result = await provider.parseExpense("สวัสดีครับ");

      expect(result).toEqual({
        type: "UNKNOWN",
        amount: null,
        description: "สวัสดีครับ",
        category: "อื่นๆ",
      });
    });

    it("should handle malformed JSON response", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"incomplete": ',
        },
      });

      const result = await provider.parseExpense("test message");

      expect(result.type).toBe("UNKNOWN");
      expect(result.description).toBe("test message");
    });

    it("should throw ExternalServiceError when API fails", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API timeout"));

      await expect(provider.parseExpense("test")).rejects.toThrow(
        "Google Gemini"
      );
    });

    it("should use gemini-2.5-flash model", async () => {
      const mockGetModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      mockGoogleAI.mockImplementation(
        () =>
          ({
            getGenerativeModel: mockGetModel,
          }) as any
      );

      provider = new GoogleProvider("test-api-key");

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              type: "EXPENSE",
              amount: 100,
              description: "test",
              category: "อื่นๆ",
            }),
        },
      });

      await provider.parseExpense("test");

      expect(mockGetModel).toHaveBeenCalledWith({
        model: "gemini-2.5-flash",
      });
    });

    it("should include system prompt in request", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              type: "EXPENSE",
              amount: 100,
              description: "test",
              category: "อื่นๆ",
            }),
        },
      });

      await provider.parseExpense("กินข้าว 100");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("กินข้าว 100")
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("User message:")
      );
    });
  });

  describe("Constructor", () => {
    it("should create instance with API key", () => {
      expect(() => new GoogleProvider("my-api-key")).not.toThrow();
    });

    it("should initialize GoogleGenerativeAI client", () => {
      new GoogleProvider("test-key");

      expect(mockGoogleAI).toHaveBeenCalledWith("test-key");
    });
  });
});
