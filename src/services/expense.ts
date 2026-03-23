import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";
import { ParsedExpense, MonthlySummary, RecentExpense } from "../types";

export async function getOrCreateUser(lineUserId: string, name?: string) {
  return prisma.user.upsert({
    where: { lineUserId },
    update: {},
    create: { lineUserId, name },
  });
}

async function getOrCreateCategory(userId: string, name: string) {
  return prisma.category.upsert({
    where: { userId_name: { userId, name } },
    update: {},
    create: { userId, name },
  });
}

export async function saveExpense(
  lineUserId: string,
  parsed: ParsedExpense
) {
  const user = await getOrCreateUser(lineUserId);
  const category = await getOrCreateCategory(user.id, parsed.category);

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      amount: parsed.amount!,
      description: parsed.description,
      categoryId: category.id,
      type: parsed.type as "INCOME" | "EXPENSE",
    },
  });

  logger.info("Expense saved", {
    userId: user.id,
    amount: parsed.amount,
    type: parsed.type,
    category: parsed.category,
  });

  return expense;
}

export async function getMonthlySummary(
  lineUserId: string
): Promise<MonthlySummary> {
  const user = await getOrCreateUser(lineUserId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { category: true },
  });

  const totalIncome = expenses
    .filter((e) => e.type === "INCOME")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = expenses
    .filter((e) => e.type === "EXPENSE")
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryMap = new Map<string, number>();
  expenses
    .filter((e) => e.type === "EXPENSE")
    .forEach((e) => {
      const name = e.category?.name ?? "อื่นๆ";
      categoryMap.set(name, (categoryMap.get(name) ?? 0) + e.amount);
    });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory: Array.from(categoryMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
  };
}

export async function getRecentExpenses(
  lineUserId: string
): Promise<RecentExpense[]> {
  const user = await getOrCreateUser(lineUserId);

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return expenses.map((e) => ({
    description: e.description,
    amount: e.amount,
    type: e.type,
    category: e.category?.name ?? null,
    date: e.date,
  }));
}