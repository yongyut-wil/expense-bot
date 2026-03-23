/**
 * Mock for Prisma Client
 * ใช้สำหรับ testing โดยไม่ต้องเชื่อมต่อ database จริง
 */

const mockPrisma = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $on: jest.fn(),
  
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  
  category: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  
  expense: {
    create: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
};

export const prisma = mockPrisma as any;
