# 🤖 AI Configuration Guide

คู่มือการตั้งค่าและปรับแต่ง AI สำหรับ Expense Bot

## 📋 Overview

Expense Bot ใช้ Google Gemini AI เป็น primary parser และมี regex-based fallback parser สำรองเมื่อ AI ไม่พร้อมใช้งาน

## 🎯 AI Provider Architecture

### Factory Pattern

```typescript
// src/services/index.ts
function createAIProvider(): AIProvider {
  const provider = config.AI_PROVIDER; // "google" | "openai" | "anthropic"

  switch (provider) {
    case "google":
      return new GoogleProvider(config.GOOGLE_API_KEY);
    // case "openai":
    //   return new OpenAIProvider(config.OPENAI_API_KEY);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
```

**ข้อดี:**

- ✅ เปลี่ยน provider ได้ง่าย
- ✅ Interface เดียวกัน
- ✅ ง่ายต่อการทดสอบ

## 🔧 Current Implementation: Google Gemini

### Model Configuration

```typescript
// src/services/google.ts
const model = this.client.getGenerativeModel({
  model: "gemini-2.5-flash", // Fast & affordable
});
```

**Model Options:**

- `gemini-2.5-flash` ⭐ - Fast, cheap, good for text
- `gemini-2.5-flash-vision` - รองรับภาพ (OCR)
- `gemini-2.5-pro` - Slower but more accurate

### API Limits

**Free Tier:**

- 🆓 20 requests/day
- ⚡ Rate limit: 2 requests/minute
- 📦 Max tokens: 32K input, 8K output

**Paid Tier:**

- 💰 $0.00002/request (flash)
- 🚀 Higher rate limits
- 📦 Same token limits

## 📝 Prompt Engineering

### System Prompt Location

File: `src/services/ai/prompt.ts`

```typescript
export const SYSTEM_PROMPT = `...`;
```

### Current Prompt Structure

```
1. Role Definition
   "คุณคือผู้ช่วยวิเคราะห์รายรับ-รายจ่าย"

2. Output Format
   JSON schema ที่ต้องตอบ

3. Categories List
   หมวดหมู่ที่รองรับทั้งหมด

4. Classification Rules
   กฎการแยก INCOME/EXPENSE/UNKNOWN

5. Amount Extraction Rules
   วิธีดึงตัวเลขจากข้อความ

6. Examples
   ตัวอย่างครบทุกกรณี (6+ ตัวอย่าง)

7. Important Notes
   ข้อควรระวัง (JSON only, no markdown)
```

### Full Prompt Breakdown

#### 1. Output Schema

```json
{
  "type": "INCOME" | "EXPENSE" | "UNKNOWN",
  "amount": number | null,
  "description": "รายละเอียดสั้นๆ",
  "category": "หมวดหมู่"
}
```

#### 2. Categories

**รายจ่าย (Expenses):**

- อาหาร, เดินทาง, ช้อปปิ้ง, บันเทิง
- สุขภาพ, ที่พัก, สาธารณูปโภค
- **การศึกษา** ⭐ (เพิ่มใหม่)
- อื่นๆ

**รายรับ (Income):**

- เงินเดือน, รายได้อื่น, โบนัส, อื่นๆ

#### 3. Classification Rules

```
EXPENSE: คำที่บ่งบอก → "กิน", "ซื้อ", "จ่าย", "ค่า"
INCOME: คำที่บ่งบอก → "ได้", "รับ", "เงินเดือน", "โบนัส"
UNKNOWN: ข้อความทั่วไป → "สวัสดี", "ขอบคุณ"
```

#### 4. Amount Extraction

```
1. หาตัวเลขในข้อความ
2. ถ้ามี "บาท" หรือ "฿" → ดึงตัวเลขข้างหน้า
3. ถ้าไม่มีหน่วย แต่มีตัวเลข → ถือว่าเป็นบาท
4. ถ้าไม่มีตัวเลขเลย → amount: null
```

#### 5. Examples

```typescript
// Expense Examples
"กินข้าว 120" → {type: "EXPENSE", amount: 120, category: "อาหาร"}
"ค่าคอร์สเรียน 500" → {type: "EXPENSE", amount: 500, category: "การศึกษา"}
"ค่ารถ BTS 44 บาท" → {type: "EXPENSE", amount: 44, category: "เดินทาง"}

// Income Examples
"รับเงินเดือน 30000" → {type: "INCOME", amount: 30000, category: "เงินเดือน"}
"ได้โบนัส 5000 บาท" → {type: "INCOME", amount: 5000, category: "โบนัส"}

// Unknown Example
"สวัสดีครับ" → {type: "UNKNOWN", amount: null, category: "อื่นๆ"}
```

## 🎨 Prompt Optimization Tips

### 1. Be Specific

❌ **Bad:** "แยกรายรับรายจ่าย"
✅ **Good:** "ถ้ามีคำว่า 'กิน', 'ซื้อ', 'จ่าย' → EXPENSE"

### 2. Provide Examples

- อย่างน้อย 3 ตัวอย่างต่อประเภท
- ครอบคลุม edge cases
- ใช้ภาษาไทยจริง

### 3. Enforce Format

```
"สำคัญ: ตอบเป็น JSON object เดียวเท่านั้น ห้ามมี markdown หรือ text อื่นใดๆ"
```

### 4. Handle Ambiguity

```
Input: "ค่าอาหาร" (ไม่มีจำนวนเงิน)
→ {type: "UNKNOWN", amount: null, ...}

Input: "120" (มีแต่ตัวเลข)
→ {type: "UNKNOWN", amount: null, ...}
```

## 🔄 Fallback Parser

### When It's Used

```typescript
// src/services/index.ts
try {
  return await aiProvider.parseExpense(text);
} catch (err) {
  logger.warn("AI provider failed, using fallback parser");
  return parseFallback(text); // ← Regex-based
}
```

**Triggers:**

- API quota exceeded
- Network error
- AI response invalid JSON
- Timeout

### Fallback Logic

```typescript
// src/services/fallback.ts
export function parseFallback(text: string): ParsedExpense {
  // 1. Extract amount
  const amountMatch = text.match(/\d+(?:,\d{3})*(?:\.\d{1,2})?/);
  const amount = amountMatch
    ? parseFloat(amountMatch[0].replace(/,/g, ""))
    : null;

  // 2. Detect type
  const isIncome = /ได้|รับ|เงินเดือน|โบนัส/.test(text);
  const isExpense = /กิน|ซื้อ|จ่าย|ค่า/.test(text);

  // 3. Default category
  const category = "อื่นๆ"; // ไม่มี AI จะหมวดหมู่ไม่ได้

  return {
    type: isIncome ? "INCOME" : isExpense ? "EXPENSE" : "UNKNOWN",
    amount,
    description: text,
    category,
  };
}
```

**Limitations:**

- ❌ ไม่มีการจัดหมวดหมู่อัตโนมัติ
- ❌ Regex ไม่ฉลาดเท่า AI
- ✅ แต่ดึง amount ได้ดี

## 📊 Monitoring & Analytics

### Track AI Usage

```typescript
// Add to src/services/google.ts
logger.info("AI request", {
  model: "gemini-2.5-flash",
  inputTokens: result.response.usageMetadata?.promptTokenCount,
  outputTokens: result.response.usageMetadata?.candidatesTokenCount,
});
```

### Track Fallback Rate

```typescript
// Add counter
let fallbackCount = 0;
let totalRequests = 0;

export function getFallbackRate() {
  return (fallbackCount / totalRequests) * 100;
}
```

### Cost Estimation

```typescript
// Gemini Pricing (Pay-as-you-go)
const COST_PER_REQUEST = 0.00002; // flash model
const REQUESTS_PER_DAY = 100;

const monthlyCost = COST_PER_REQUEST * REQUESTS_PER_DAY * 30;
console.log(`Estimated cost: $${monthlyCost.toFixed(2)}/month`);
// Output: $0.06/month
```

## 🚀 Advanced Configurations

### 1. Add New Category

```typescript
// src/services/ai/prompt.ts
const SYSTEM_PROMPT = `
หมวดหมู่ที่ใช้ได้:
- รายจ่าย: อาหาร, ..., การศึกษา, งานบุญ ← เพิ่มใหม่
`;

// เพิ่ม example
Input: "ทำบุญ 100"
Output: {"type":"EXPENSE","amount":100,"category":"งานบุญ"}
```

### 2. Multi-language Support

```typescript
// src/services/ai/prompt.ts
const SYSTEM_PROMPT = `
คุณคือผู้ช่วยวิเคราะห์รายรับ-รายจ่าย รองรับทั้งภาษาไทยและอังกฤษ

Examples:
Input: "lunch 150"
Output: {"type":"EXPENSE","amount":150,"category":"อาหาร"}
`;
```

### 3. Date/Time Extraction

```typescript
// เพิ่มใน schema
{
  "type": "...",
  "amount": 0,
  "description": "...",
  "category": "...",
  "date": "2026-03-25"  ← เพิ่มใหม่
}

// เพิ่มใน prompt
"ถ้ามีวันที่ ให้แปลงเป็น YYYY-MM-DD format"
```

### 4. Custom Rules

```typescript
// src/services/ai/prompt.ts
const SYSTEM_PROMPT = `
กฎพิเศษ:
- ถ้าพบ "ทิป" → category: "บันเทิง"
- ถ้าพบ "ค่าปรับ" → category: "อื่นๆ"
- ถ้ายอดเงิน > 10000 → ตรวจสอบ 2 รอบ
`;
```

## 🧪 Testing AI Prompt

### 1. Unit Test

```typescript
// src/__tests__/services/google.test.ts
it("should parse Thai expense message", async () => {
  const result = await googleProvider.parseExpense("กินข้าว 120");

  expect(result.type).toBe("EXPENSE");
  expect(result.amount).toBe(120);
  expect(result.category).toBe("อาหาร");
});
```

### 2. Manual Testing

```bash
# Test with actual API
npm run dev

# Send via LINE Bot or curl
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[{"message":{"text":"กินข้าว 120"},...}]}'
```

### 3. A/B Testing

```typescript
// Compare prompts
const promptV1 = "old prompt";
const promptV2 = "new improved prompt";

const results = testCases.map((test) => ({
  input: test,
  v1: parseWithPrompt(promptV1, test),
  v2: parseWithPrompt(promptV2, test),
}));

// Analyze accuracy
```

## 📈 Performance Optimization

### 1. Caching

```typescript
// Cache common queries
const cache = new Map<string, ParsedExpense>();

export async function parseExpenseMessage(text: string) {
  if (cache.has(text)) {
    return cache.get(text)!;
  }

  const result = await aiProvider.parseExpense(text);
  cache.set(text, result);
  return result;
}
```

**⚠️ ระวัง:** Cache size limit (ใช้ LRU cache)

### 2. Batch Processing

```typescript
// ถ้ามีหลายข้อความพร้อมกัน
const results = await Promise.all(
  messages.map((msg) => aiProvider.parseExpense(msg))
);
```

### 3. Timeout Configuration

```typescript
// src/services/google.ts
const result = await Promise.race([
  model.generateContent(prompt),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 5000)
  ),
]);
```

## 🔐 API Key Management

### Best Practices

1. **Never Hardcode**

   ```typescript
   ❌ const apiKey = "AIza...";
   ✅ const apiKey = process.env.GOOGLE_API_KEY;
   ```

2. **Rotate Regularly**
   - เปลี่ยน API key ทุก 3-6 เดือน
   - หรือเมื่อสงสัยว่า leak

3. **Monitor Usage**
   - ดู quota ที่ [Google AI Studio](https://makersuite.google.com/)
   - ตั้ง alerts เมื่อใกล้ limit

4. **Use Service Account (Production)**
   ```bash
   # Better than API key
   gcloud auth application-default login
   ```

## 🎯 Common Issues & Solutions

### Issue: "Rate limit exceeded"

**Solution:**

```typescript
// Add retry logic with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
}
```

### Issue: AI returns invalid JSON

**Solution:**

````typescript
// src/services/google.ts
function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return jsonMatch ? jsonMatch[1].trim() : text;
}
````

### Issue: AI สับสนหมวดหมู่

**Solution:**

- เพิ่มตัวอย่างใน prompt
- ใช้คำ keywords ชัดเจนกว่า
- เพิ่มกฎพิเศษ

## 📚 Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)

## 🔮 Future Enhancements

### 1. Multi-model Ensemble

```typescript
const results = await Promise.all([
  gemini.parse(text),
  gpt4.parse(text),
  claude.parse(text),
]);

// Vote or average
return mostCommon(results);
```

### 2. User-specific Learning

```typescript
// Track user preferences
const userPreferences = {
  กินข้าว: "อาหาร", // user always means food
  grab: "เดินทาง", // not shopping
};

// Adjust prompt per user
```

### 3. Context-aware Parsing

```typescript
// ใช้ context จากข้อความก่อนหน้า
const context = getRecentMessages(userId, 5);
const prompt = `${SYSTEM_PROMPT}\n\nContext: ${context}\n\nNew: ${text}`;
```

---

**Happy Prompting! 🤖**

อ่านเพิ่มเติม: [DEPLOYMENT.md](./DEPLOYMENT.md) | [SECURITY.md](./SECURITY.md)
