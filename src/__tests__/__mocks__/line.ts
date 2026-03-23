/**
 * Mock for @line/bot-sdk
 * ใช้สำหรับ testing โดยไม่ต้องเรียก LINE API จริง
 */

export const Client = jest.fn().mockImplementation(() => ({
  replyMessage: jest.fn().mockResolvedValue({}),
  pushMessage: jest.fn().mockResolvedValue({}),
  getProfile: jest.fn().mockResolvedValue({
    userId: "U1234567890",
    displayName: "Test User",
    pictureUrl: "https://example.com/avatar.jpg",
    statusMessage: "Hello World",
  }),
}));

export const validateSignature = jest.fn().mockReturnValue(true);

export const middleware = jest.fn().mockImplementation(() => {
  return (req: any, res: any, next: any) => next();
});
