export interface ParsedExpense {
  type: "INCOME" | "EXPENSE" | "UNKNOWN";
  amount: number | null;
  description: string;
  category: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { category: string; total: number }[];
}

export interface RecentExpense {
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string | null;
  date: Date;
}