/**
 * Test สำหรับ Expense Service
 * ทดสอบการบันทึกและดึงข้อมูล expense
 */

import {
  saveExpense,
  getMonthlySummary,
  getRecentExpenses,
} from "../../services/expense";

// Mock Prisma
jest.mock("../../db/prisma");
import { prisma } from "../../db/prisma";

const mockUser = {
  id: "user-1",
  lineUserId: "line-123",
  name: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCategory = {
  id: "cat-1",
  userId: "user-1",
  name: "อาหาร",
  icon: null,
  createdAt: new Date(),
};

describe("Expense Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveExpense", () => {
    it("should save expense and return created record", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.category.upsert as any).mockResolvedValue(mockCategory);
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp-1",
        userId: "user-1",
        amount: 120,
        type: "EXPENSE",
        description: "ค่าอาหาร",
        categoryId: "cat-1",
        date: new Date(),
        createdAt: new Date(),
      } as any);

      const result = await saveExpense("line-123", {
        type: "EXPENSE",
        amount: 120,
        description: "ค่าอาหาร",
        category: "อาหาร",
      });

      expect(prisma.user.upsert).toHaveBeenCalled();
      expect(prisma.category.upsert).toHaveBeenCalled();
      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 120,
          type: "EXPENSE",
          description: "ค่าอาหาร",
        }),
      });
      expect(result.amount).toBe(120);
    });

    it("should create new user if not exists", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.category.upsert as any).mockResolvedValue(mockCategory);
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp-1",
        amount: 50,
      } as any);

      await saveExpense("new-user-123", {
        type: "EXPENSE",
        amount: 50,
        description: "ค่ารถ",
        category: "เดินทาง",
      });

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lineUserId: "new-user-123" },
          create: { lineUserId: "new-user-123" },
          update: {},
        })
      );
    });

    it("should create new category if not exists", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.category.upsert as any).mockResolvedValue(mockCategory);
      (prisma.expense.create as any).mockResolvedValue({} as any);

      await saveExpense("line-123", {
        type: "EXPENSE",
        amount: 100,
        description: "ของใหม่",
        category: "ช็อปปิ้ง",
      });

      expect(prisma.category.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_name: { userId: "user-1", name: "ช็อปปิ้ง" },
          }),
        })
      );
    });

    it("should save income correctly", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.category.upsert as any).mockResolvedValue(mockCategory);
      (prisma.expense.create as any).mockResolvedValue({
        type: "INCOME",
        amount: 30000,
      } as any);

      const result = await saveExpense("line-123", {
        type: "INCOME",
        amount: 30000,
        description: "เงินเดือน",
        category: "เงินเดือน",
      });

      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "INCOME",
          amount: 30000,
        }),
      });
    });
  });

  describe("getMonthlySummary", () => {
    it("should calculate summary correctly", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.expense.findMany as any).mockResolvedValue([
        {
          type: "INCOME",
          amount: 30000,
          category: { name: "เงินเดือน" },
        },
        {
          type: "EXPENSE",
          amount: 120,
          category: { name: "อาหาร" },
        },
        {
          type: "EXPENSE",
          amount: 500,
          category: { name: "อาหาร" },
        },
        {
          type: "EXPENSE",
          amount: 200,
          category: { name: "เดินทาง" },
        },
      ] as any);

      const summary = await getMonthlySummary("line-123");

      expect(summary.totalIncome).toBe(30000);
      expect(summary.totalExpense).toBe(820);
      expect(summary.balance).toBe(29180);
      expect(summary.byCategory).toHaveLength(2);
      
      // หมวดอาหารรวม 620 ต้องอยู่อันดับแรก
      expect(summary.byCategory[0].category).toBe("อาหาร");
      expect(summary.byCategory[0].total).toBe(620);
    });

    it("should return zero summary when no expenses", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.expense.findMany as any).mockResolvedValue([]);

      const summary = await getMonthlySummary("line-123");

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(0);
      expect(summary.balance).toBe(0);
      expect(summary.byCategory).toHaveLength(0);
    });

    it("should only include current month expenses", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.expense.findMany as any).mockResolvedValue([
        { type: "EXPENSE", amount: 100, category: { name: "อาหาร" } },
      ] as any);

      await getMonthlySummary("line-123");

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe("getRecentExpenses", () => {
    it("should return formatted recent expenses", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.expense.findMany as any).mockResolvedValue([
        {
          description: "กินข้าว",
          amount: 120,
          type: "EXPENSE",
          category: { name: "อาหาร" },
          date: new Date("2026-03-23"),
        },
        {
          description: "ค่ารถ",
          amount: 50,
          type: "EXPENSE",
          category: { name: "เดินทาง" },
          date: new Date("2026-03-22"),
        },
      ] as any);

      const result = await getRecentExpenses("line-123");

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe("กินข้าว");
      expect(result[0].amount).toBe(120);
      expect(result[0].category).toBe("อาหาร");
      expect(result[0].type).toBe("EXPENSE");
    });

    it("should handle expense with no category", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.expense.findMany as any).mockResolvedValue([
        {
          description: "ค่าใช้จ่าย",
          amount: 100,
          type: "EXPENSE",
          category: null,
          date: new Date(),
        },
      ] as any);

      const result = await getRecentExpenses("line-123");

      expect(result[0].category).toBeNull();
    });

    it("should limit to 5 recent items", async () => {
      (prisma.user.upsert as any).mockResolvedValue(mockUser);
      (prisma.expense.findMany as any).mockResolvedValue([]);

      await getRecentExpenses("line-123");

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });
});
