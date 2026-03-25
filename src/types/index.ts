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

export interface OcrResult {
  success: boolean;
  type: "INCOME" | "EXPENSE" | "UNKNOWN";
  amount: number | null;
  description: string;
  category: string;
  date: string | null;
  merchant: string | null;
  confidence: "high" | "medium" | "low";
}

export interface PendingConfirmation {
  userId: string;
  ocrResult?: OcrResult;
  parsedExpense?: ParsedExpense;
  imageMessageId?: string;
  createdAt: Date;
}
