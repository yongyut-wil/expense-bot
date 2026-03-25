import { ParsedExpense } from "../types";
import { logger } from "../utils/logger";

/**
 * Fallback parser ที่ใช้ regex แทน AI
 * ใช้เมื่อ AI provider ไม่ทำงาน
 */
export function parseFallback(text: string): ParsedExpense {
  logger.info("Using fallback regex parser");
  
  const normalized = text.toLowerCase().trim();
  
  // Extract amount (ตัวเลข)
  const amountMatch = normalized.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
  
  // ถ้าไม่มีจำนวนเงิน ให้ return UNKNOWN
  if (!amount) {
    return {
      type: "UNKNOWN",
      amount: null,
      description: text,
      category: "อื่นๆ",
    };
  }
  
  // Detect type (รายรับ vs รายจ่าย)
  const incomeKeywords = ["รายรับ", "เงินเข้า", "รับ", "ได้", "โบนัส", "เงินเดือน", "รายได้", "income", "เข้า"];
  const expenseKeywords = ["รายจ่าย", "เงินออก", "จ่าย", "ออก", "ซื้อ", "ใช้", "expense"];
  
  const hasIncomeKeyword = incomeKeywords.some(keyword => normalized.includes(keyword));
  const hasExpenseKeyword = expenseKeywords.some(keyword => normalized.includes(keyword));
  
  // ถ้ามีทั้ง income และ expense keywords ให้เลือกตามที่ปรากฏก่อน
  let isIncome = false;
  if (hasIncomeKeyword && hasExpenseKeyword) {
    const incomePos = incomeKeywords.map(k => normalized.indexOf(k)).filter(i => i >= 0)[0];
    const expensePos = expenseKeywords.map(k => normalized.indexOf(k)).filter(i => i >= 0)[0];
    isIncome = incomePos < expensePos;
  } else {
    isIncome = hasIncomeKeyword;
  }
  
  // Detect category
  let category = "อื่นๆ";
  const categoryMap: Record<string, string> = {
    "กิน": "อาหาร",
    "ข้าว": "อาหาร",
    "อาหาร": "อาหาร",
    "กาแฟ": "อาหาร",
    "ขนม": "อาหาร",
    "ไอติม": "อาหาร",
    "รถ": "เดินทาง",
    "bts": "เดินทาง",
    "mrt": "เดินทาง",
    "แท็กซี่": "เดินทาง",
    "แกร็บ": "เดินทาง",
    "grab": "เดินทาง",
    "taxi": "เดินทาง",
    "น้ำมัน": "เดินทาง",
    "ช็อป": "ช็อปปิ้ง",
    "ช้อป": "ช็อปปิ้ง",
    "ซื้อ": "ช็อปปิ้ง",
    "เสื้อ": "ช็อปปิ้ง",
    "กางเกง": "ช็อปปิ้ง",
    "หนัง": "บันเทิง",
    "เกม": "บันเทิง",
    "คอน": "บันเทิง",
    "ยา": "สุขภาพ",
    "หมอ": "สุขภาพ",
    "โรงพยาบาล": "สุขภาพ",
    "ค่าเช่า": "ที่พัก",
    "ค่าน้ำ": "สาธารณูปโภค",
    "ค่าไฟ": "สาธารณูปโภค",
    "ค่าเน็ต": "สาธารณูปโภค",
    "เงินเดือน": "เงินเดือน",
    "โบนัส": "รายได้อื่น",
  };
  
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (normalized.includes(keyword)) {
      category = cat;
      break;
    }
  }
  
  // Extract description (ใช้ข้อความเดิม)
  const description = text.trim();
  
  return {
    type: isIncome ? "INCOME" : "EXPENSE",
    amount,
    description,
    category,
  };
}
