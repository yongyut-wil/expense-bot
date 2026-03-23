import { ParsedExpense } from "../types";

// Interface กลาง — ทุก provider ต้อง implement นี้
export interface AIProvider {
  parseExpense(text: string): Promise<ParsedExpense>;
}