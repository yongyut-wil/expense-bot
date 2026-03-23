/**
 * Mock for @google/generative-ai
 * ใช้สำหรับ testing โดยไม่ต้องเรียก Google AI API จริง
 */

export const GoogleGenerativeAI = jest.fn().mockImplementation(() => ({
  getGenerativeModel: jest.fn().mockReturnValue({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            type: "EXPENSE",
            amount: 100,
            description: "ทดสอบ",
            category: "อาหาร",
          }),
      },
    }),
  }),
}));
