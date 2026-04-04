# 🎯 Design Decisions & Architecture Reasoning

เอกสารนี้อธิบาย**เหตุผล**เบื้องหลังการออกแบบระบบ Expense Bot แบบละเอียด เหมาะสำหรับนักพัฒนาที่ต้องการเข้าใจว่า**ทำไม**ถึงออกแบบแบบนี้ ไม่ใช่แค่รู้ว่าทำ**อะไร**

---

## 📊 ภาพรวม Architecture

```
User (LINE)
    ↓ ส่งข้อความ / รูปภาพ
LINE Platform
    ↓ POST /webhook
Express Server
    ↓
Middleware Chain
    ↓
Handler
    ↓
Services (AI, Expense, LINE)
    ↓
PostgreSQL Database
```

ดูเหมือนง่าย แต่แต่ละชั้นมีเหตุผลของมันครับ มาไล่ดูทีละส่วนเลย

---

## 1️⃣ Entry Point — `src/index.ts`

### การทำงาน

```
รัน app
  ├── 1. Validate config ก่อน (Zod)
  ├── 2. Connect database
  ├── 3. สร้าง Express app
  ├── 4. เปิด server
  └── 5. ตั้ง graceful shutdown
```

### วิธีคิด: ลำดับสำคัญมาก

**ถ้า config ผิด** → หยุดทันที ไม่ต้องเสียเวลา connect database

**ถ้า database connect ไม่ได้** → หยุดทันที ไม่ต้อง serve request ที่จะ fail อยู่ดี

นี่คือ **Fail Fast Principle** — รู้ปัญหาเร็วที่สุด ดีกว่าให้ app รันแบบครึ่งๆ กลางๆ

### Graceful Shutdown คืออะไร?

เมื่อได้รับ `SIGTERM` (เช่นตอน k8s rolling update) จะ:

1. รอให้ request ที่ค้างอยู่เสร็จก่อน
2. Disconnect database อย่างถูกต้อง
3. ค่อยปิด process

**ไม่ทำให้ user เจอ error กลางคัน**

```typescript
// src/index.ts
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

---

## 2️⃣ Config Validation — `src/config/index.ts`

### การทำงาน

```
โหลด .env
    ↓
Zod parse และ validate ทุก field
    ↓
ผ่าน → export config object ที่ type-safe
ไม่ผ่าน → process.exit(1) พร้อมบอกว่า field ไหนผิด
```

### วิธีคิด: แก้ปัญหาคลาสสิกของ Node.js

ปัญหาคลาสสิกของ Node.js คือ `process.env.SOMETHING` มี type เป็น `string | undefined` เสมอ

**ถ้าไม่ validate** → ต้องเขียน null check ทุกที่ที่ใช้:

```typescript
// แบบไม่ดี - ต้อง check ทุกที่
const secret = process.env.LINE_CHANNEL_SECRET;
if (!secret) {
  throw new Error("Missing LINE_CHANNEL_SECRET");
}
// ใช้ secret...

// อีก 50 ที่ต้อง check แบบนี้
```

**Zod แก้ปัญหานี้** โดย validate ครั้งเดียวตอน startup:

```typescript
// แบบดี - validate ครั้งเดียว
const configSchema = z.object({
  LINE_CHANNEL_SECRET: z.string().min(1),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().min(1),
  // ...
});

export const config = configSchema.parse(process.env);
```

แล้ว export `config` object ที่ **type-safe** ออกมา

ทุกที่ที่ใช้ `config.LINE_CHANNEL_SECRET` มั่นใจได้ว่าเป็น `string` แน่นอน ไม่ใช่ `string | undefined`

### ข้อดีเพิ่มเติม

- **Error message ชัดเจน**: Zod บอกว่า field ไหนผิด และผิดยังไง
- **Type inference**: TypeScript รู้ type อัตโนมัติจาก schema
- **Documentation**: Schema เป็น documentation ที่อ่านง่าย

---

## 3️⃣ Middleware Chain — `src/app.ts`

### การทำงาน

```
Request เข้ามา
    ↓
1. Helmet          → ตั้ง HTTP security headers
2. Rate Limiter    → จำกัด request ต่อ IP
3. JSON Parser     → แปลง body เป็น object
4. Router
    ├── GET /health           → ไม่ต้อง auth
    └── POST /webhook
            ↓
        4.1 Webhook Rate Limiter  → จำกัดเฉพาะ webhook
        4.2 LINE Signature Verify → ตรวจว่ามาจาก LINE จริง
        4.3 Webhook Handler       → ประมวลผล
5. 404 Handler     → route ไม่เจอ
6. Error Handler   → จัดการ error ทั้งหมด
```

### วิธีคิด: Middleware เปรียบเหมือน "ด่านตรวจ"

ลำดับความสำคัญ:

#### 1. **Helmet ก่อนสุด**

เพราะ security headers ต้องอยู่ใน response **ทุกอัน**

ถ้าวางหลัง error อาจไม่ได้ header พวกนี้:

- `X-Frame-Options: SAMEORIGIN` (ป้องกัน clickjacking)
- `X-Content-Type-Options: nosniff` (ป้องกัน MIME sniffing)
- `Strict-Transport-Security` (บังคับ HTTPS)

#### 2. **Rate Limiter ก่อน parse JSON**

เพราะถ้า request เกิน limit ไม่ต้องเสียเวลา parse body เลย

```typescript
// แบบดี
app.use(rateLimiter); // เช็คก่อน
app.use(express.json()); // parse ทีหลัง

// แบบไม่ดี
app.use(express.json()); // เสียเวลา parse
app.use(rateLimiter); // ถึงค่อยเช็ค (สาย!)
```

#### 3. **Verify LINE Signature เฉพาะ /webhook**

เพราะ `/health` ต้องการให้ k8s liveness probe เรียกได้โดยไม่ต้องมี signature

```typescript
// /health ไม่ต้อง verify (สำหรับ monitoring)
app.get("/health", healthHandler);

// /webhook ต้อง verify (ป้องกัน unauthorized access)
app.post(
  "/webhook",
  verifyLineSignature, // ด่านนี้อยู่เฉพาะ webhook
  webhookHandler
);
```

#### 4. **Error Handler อยู่ท้ายสุดเสมอ**

Express กำหนดว่า error handler ต้อง:

- มี **4 parameters**: `(err, req, res, next)`
- อยู่**หลัง route ทั้งหมด**

ถ้าวางไว้กลางจะไม่ทำงาน:

```typescript
// ❌ ผิด - error handler อยู่กลาง
app.use(errorHandler); // ไม่ทำงาน!
app.post("/webhook", webhookHandler);

// ✅ ถูก - error handler อยู่ท้าย
app.post("/webhook", webhookHandler);
app.use(errorHandler); // ทำงาน!
```

---

## 4️⃣ LINE Signature Verification — `src/middleware/lineSignature.ts`

### การทำงาน

```
อ่าน header x-line-signature
    ↓
คำนวณ HMAC-SHA256 จาก request body + Channel Secret
    ↓
เปรียบเทียบด้วย timingSafeEqual
    ↓
ผ่าน → next()
ไม่ผ่าน → UnauthorizedError
```

### วิธีคิด: ทำไมต้อง verify signature?

**Webhook URL ของเราเป็น public endpoint** → ใครก็ POST มาได้

ถ้าไม่ verify signature:

- คนอื่นอาจแกล้งทำเป็น LINE
- ส่งข้อมูลปลอมมา (fake messages)
- ทำให้ระบบบันทึกข้อมูลผิด

### HMAC-SHA256 ทำงานอย่างไร?

1. **LINE** เซ็น request ด้วย Channel Secret (มีแค่เรากับ LINE รู้)
2. **เรา** คำนวณซ้ำด้วย secret เดียวกัน
3. **เปรียบเทียบ** ถ้าตรงกัน = มาจาก LINE จริง

```typescript
const signature = req.headers["x-line-signature"] as string;
const body = JSON.stringify(req.body);

const expectedSignature = crypto
  .createHmac("sha256", LINE_CHANNEL_SECRET)
  .update(body)
  .digest("base64");

// เปรียบเทียบ
crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
```

### ทำไมใช้ timingSafeEqual?

**ป้องกัน Timing Attack**

การเปรียบเทียบ string แบบปกติ `a === b`:

- หยุดทันทีที่เจอตัวอักษรไม่ตรง
- ทำให้ attacker **วัดเวลา response** แล้วเดา signature ได้ทีละตัว

```typescript
// ❌ อันตราย - timing attack ได้
if (signature === expectedSignature) { ... }

// ✅ ปลอดภัย - ใช้เวลาคงที่เสมอ
crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
)
```

`timingSafeEqual` ใช้เวลา**คงที่เสมอ** ไม่ว่าจะตรงหรือไม่ → ป้องกัน timing attack

---

## 5️⃣ Custom Error Classes — `src/utils/errors.ts`

### โครงสร้าง

```
AppError (base)
    ├── ValidationError    400 — ข้อมูลผิด
    ├── UnauthorizedError  401 — auth ไม่ผ่าน
    ├── NotFoundError      404 — ไม่เจอ
    └── ExternalServiceError 503 — LINE/AI มีปัญหา
```

### วิธีคิด: แบ่ง error เป็น 2 ประเภท

#### 1. Operational Error (คาดการณ์ได้)

เช่น:

- Validation fail → user ส่งข้อมูลผิด
- LINE signature ผิด → request ไม่ถูกต้อง
- AI timeout → external service มีปัญหา

**พวกนี้ไม่ใช่ bug** → log เป็น `warn` และ return HTTP error code ที่เหมาะสม

```typescript
// Operational error
throw new ValidationError("Amount is required");
// → log: warn
// → response: 400 Bad Request
```

#### 2. Unexpected Error (ไม่คาดการณ์)

เช่น:

- Database crash
- Null pointer exception
- Out of memory

**พวกนี้คือ bug จริงๆ** → log เป็น `error` พร้อม stack trace และ return 500

```typescript
// Unexpected error
throw new Error("Cannot read property 'id' of undefined");
// → log: error + stack trace
// → response: 500 Internal Server Error
```

### ประโยชน์ของการแยกแบบนี้

**ตอน monitor production:**

- `warn` = user ทำอะไรผิด (ไม่ต้องแก้ code)
- `error` = มี bug ต้องไปแก้ (ต้องแก้ code ด่วน!)

```typescript
// src/middleware/errorHandler.ts
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    // Operational error
    logger.warn("Operational error", { error: err });
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Unexpected error
  logger.error("Unexpected error", { error: err, stack: err.stack });
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}
```

---

## 6️⃣ Webhook Handler — `src/handlers/message.ts`

### การทำงาน

```
รับ request
    ↓
Validate payload structure (Zod)
    ↓
ตอบ LINE กลับทันที → res.json({ status: "ok" })
    ↓
ประมวลผล event แบบ async (Promise.allSettled)
    ↓
แยกประเภท event
    ├── ไม่ใช่ message → skip
    ├── ไม่ใช่ text → skip (ตอนนี้)
    └── เป็น text → processMessage()
                        ↓
                    แยก command
                    ├── "สรุป"    → getMonthlySummary
                    ├── "ล่าสุด"  → getRecentExpenses
                    ├── "วิธีใช้" → HELP_TEXT
                    └── อื่นๆ    → parseExpenseMessage (AI)
```

### วิธีคิด: 3 Decision สำคัญ

#### 1. **ตอบ LINE ทันทีก่อน**

LINE กำหนด **timeout 30 วินาที**

ถ้าไม่ตอบภายในเวลา → LINE จะ **retry** ส่ง event มาซ้ำ

```typescript
// ✅ ดี - ตอบทันที
res.json({ status: "ok" }); // ตอบใน 1ms

// ค่อยประมวลผลทีหลัง (อาจใช้เวลา 5 วินาที)
await processMessage(event);
```

การตอบ 200 OK ทันทีแล้วค่อยประมวลผล async ทีหลัง:

- ✅ ป้องกัน timeout
- ✅ ป้องกัน duplicate processing
- ✅ User ไม่ต้องรอ

#### 2. **Promise.allSettled แทน Promise.all**

ถ้าใช้ `Promise.all`:

- event นึง fail → **ทุก event ในนั้นจะหยุดหมด**

ถ้าใช้ `Promise.allSettled`:

- แต่ละ event **ล้มเหลวแยกกัน**
- event อื่นยังทำงานต่อได้

```typescript
// ❌ ไม่ดี - event นึง fail ทุกอันหยุด
await Promise.all(events.map(processMessage));

// ✅ ดี - แต่ละ event แยกกัน
await Promise.allSettled(events.map(processMessage));
```

**ตัวอย่าง:**
User ส่ง 3 ข้อความมาพร้อมกัน:

1. "กินข้าว 120" → สำเร็จ ✅
2. "ข้อความแปลกๆ%^&\*" → AI fail ❌
3. "รับเงินเดือน 30000" → สำเร็จ ✅

`Promise.all` → ทั้ง 3 fail  
`Promise.allSettled` → 1 กับ 3 สำเร็จ, แค่ 2 fail

#### 3. **เช็ค command ก่อนส่ง AI**

คำสั่งง่ายๆ อย่าง "สรุป" ไม่ต้องเสีย API call ไปถาม AI เลย

```typescript
// เช็ค command ก่อน
if (text === "สรุป") {
  return getMonthlySummary(userId); // ไม่เรียก AI
}

// ถึงค่อยเรียก AI (ถ้าไม่ใช่ command)
const parsed = await parseExpenseMessage(text);
```

**ประโยชน์:**

- ✅ ประหยัดเงิน (ไม่เสีย API quota)
- ✅ ประหยัดเวลา (ไม่ต้องรอ AI response)
- ✅ เชื่อถือได้ (command response คงที่เสมอ)

---

## 7️⃣ AI Service — `src/services/ai/`

### การทำงาน

```
รับข้อความ
    ↓
ส่งให้ AI พร้อม System Prompt
    ↓
AI ตอบกลับเป็น JSON
    ↓
JSON.parse
    ├── สำเร็จ → return ParsedExpense
    ├── SyntaxError → return UNKNOWN (AI ตอบผิด format)
    └── API Error → throw ExternalServiceError
```

### วิธีคิด: Provider Pattern

ออกแบบเป็น **Provider Pattern** ทำให้เปลี่ยน AI engine ได้โดยแก้แค่ `.env` บรรทัดเดียว

```typescript
// .env
AI_PROVIDER = google; // เปลี่ยนแค่นี้
AI_PROVIDER = openai; // หรือ
AI_PROVIDER = anthropic; // หรือ
```

```typescript
// services/index.ts - Factory
function createAIProvider(): AIProvider {
  switch (config.AI_PROVIDER) {
    case "google":
      return new GoogleProvider(config.GOOGLE_API_KEY);
    case "openai":
      return new OpenAIProvider(config.OPENAI_API_KEY);
    case "anthropic":
      return new AnthropicProvider(config.ANTHROPIC_API_KEY);
  }
}
```

**ประโยชน์:**

- ✅ เปลี่ยน provider ง่าย (ไม่ต้องแก้ code)
- ✅ เปรียบเทียบ provider ง่าย (ลอง A vs B)
- ✅ ใช้หลาย provider พร้อมกัน (fallback)

### System Prompt แยกไฟล์

```typescript
// services/ai/prompt.ts
export const SYSTEM_PROMPT = `
คุณคือผู้ช่วยวิเคราะห์รายรับ-รายจ่าย
ตอบเป็น JSON เท่านั้น
{
  "type": "INCOME" | "EXPENSE" | "UNKNOWN",
  "amount": number | null,
  "description": "รายละเอียด",
  "category": "หมวดหมู่"
}
`;
```

**ทำไมแยกไฟล์?**

- ✅ ทุก provider ใช้ prompt **เดียวกัน** (consistent)
- ✅ แก้ prompt **ที่เดียว** มีผลกับทุก provider
- ✅ Version control prompt ได้ง่าย
- ✅ Test prompt ได้แยก

### แยก error สองแบบ

```typescript
try {
  const result = await ai.generateContent(prompt);
  const parsed = JSON.parse(result.text());
  return parsed;
} catch (err) {
  if (err instanceof SyntaxError) {
    // AI ตอบมาแต่ format ผิด - ไม่ใช่ความผิดของระบบ
    return {
      type: "UNKNOWN",
      amount: null,
      description: text,
      category: "อื่นๆ",
    };
  }

  // API call fail จริงๆ - ต้อง throw
  throw new ExternalServiceError("AI service unavailable");
}
```

**เหตุผล:**

- `SyntaxError` = AI ตอบมาแต่ format ผิด → ไม่ควร throw (แค่ return UNKNOWN)
- `API Error` = AI service ล่ม → ควร throw (เพื่อให้ error handler จัดการ)

---

## 8️⃣ Expense Service — `src/services/expense.ts`

### การทำงาน

#### saveExpense()

```
getOrCreateUser()    ← upsert ไม่ต้องเช็คก่อนว่ามีหรือยัง
    ↓
getOrCreateCategory() ← upsert เหมือนกัน
    ↓
prisma.expense.create()
    ↓
log ผลลัพธ์
```

#### getMonthlySummary()

```
ดึง expense ทั้งหมดในเดือนนั้น
    ↓
คำนวณใน memory (ไม่ใช้ SQL aggregate)
    ↓
return summary object
```

### วิธีคิด: Upsert Pattern

**ใช้ Upsert แทนการ findFirst แล้วค่อย create**

```typescript
// ❌ แบบเก่า - race condition
const user = await prisma.user.findFirst({ where: { lineUserId } });
if (!user) {
  user = await prisma.user.create({ data: { lineUserId } });
}
// ถ้า user ส่งข้อความมา 2 ครั้งพร้อมกัน → อาจสร้าง user ซ้ำ!

// ✅ แบบใหม่ - atomic operation
const user = await prisma.user.upsert({
  where: { lineUserId },
  update: {}, // ถ้ามีแล้ว ไม่ทำอะไร
  create: { lineUserId }, // ถ้ายังไม่มี สร้างใหม่
});
```

**ประโยชน์ของ Upsert:**

- ✅ Atomic operation → ป้องกัน race condition
- ✅ Code สั้นกว่า (1 query แทน 2 queries)
- ✅ Performance ดีกว่า

### คำนวณใน Memory แทน SQL Aggregate

```typescript
// ✅ แบบที่เราใช้ - คำนวณใน JS
const expenses = await prisma.expense.findMany({
  where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
});

const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
const byCategory = expenses.reduce((acc, exp) => {
  acc[exp.category.name] = (acc[exp.category.name] || 0) + exp.amount;
  return acc;
}, {});
```

```typescript
// ❌ แบบที่ไม่ใช้ - SQL aggregate (ซับซ้อน)
const total = await prisma.expense.aggregate({
  where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
  _sum: { amount: true },
});

const byCategory = await prisma.expense.groupBy({
  by: ["categoryId"],
  where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
  _sum: { amount: true },
});
```

**ทำไมคำนวณใน memory?**

- ✅ ข้อมูลต่อ user ต่อเดือน**ไม่มาก** (ไม่เกินพัน record)
- ✅ Query มาทั้งหมดแล้วคำนวณใน JS **ง่ายกว่า**
- ✅ **Debug ง่ายกว่า** aggregate query มาก
- ✅ **Flexible** - คำนวณอะไรก็ได้ใน JS

**เมื่อไหร่ควรใช้ SQL aggregate?**

- ถ้าข้อมูลเยอะมาก (หลายล้าน records)
- ถ้าต้องการ aggregate ข้าม user หลายคน
- ถ้า memory จำกัด

---

## 9️⃣ Winston Logger — `src/utils/logger.ts`

### การตั้งค่า

```typescript
const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    config.NODE_ENV === "production"
      ? winston.format.json() // Production: JSON
      : winston.format.simple() // Development: Human readable
  ),
  transports: [new winston.transports.Console()],
});
```

### วิธีคิด: Log Level มีความหมายชัดเจน

| Level   | ใช้เมื่อ                      | ตัวอย่าง                         |
| ------- | ----------------------------- | -------------------------------- |
| `error` | Bug จริงๆ ต้องไปแก้           | Database crash, null pointer     |
| `warn`  | Operational error คาดการณ์ได้ | Validation fail, AI timeout      |
| `info`  | Event สำคัญที่อยากรู้         | User saved expense, server start |
| `debug` | ข้อมูลละเอียดสำหรับ dev       | Function called, variable values |

**ตัวอย่างการใช้:**

```typescript
// error - มี bug ต้องแก้
logger.error("Database connection failed", { error: err, stack: err.stack });

// warn - user ทำอะไรผิด
logger.warn("Invalid LINE signature", { ip: req.ip });

// info - event ปกติ
logger.info("Expense saved", { userId, amount, category });

// debug - ข้อมูลละเอียด
logger.debug("Calling AI service", { text, provider: "google" });
```

### Production ใช้ JSON เพราะ...

```json
{
  "level": "info",
  "message": "Expense saved",
  "userId": "cld123...",
  "amount": 120,
  "category": "อาหาร",
  "timestamp": "2024-03-23T10:00:00.000Z"
}
```

**Log aggregator** อย่าง Grafana Loki หรือ ELK Stack:

- ✅ อ่าน JSON ได้โดยตรง
- ✅ Filter และ query log ได้ง่าย (เช่น "หา error ทั้งหมดของ user X")
- ✅ สร้าง dashboard และ alert ได้

**Plain text** ใช้ได้แค่ `grep`:

```
❌ grep ได้แค่นี้: grep "ERROR" app.log
✅ JSON query ได้ซับซ้อน: SELECT * WHERE level="error" AND userId="X"
```

---

## 🔟 Testing Strategy

### โครงสร้าง

```
Unit Test
    ├── ai.test.ts      → mock Anthropic client
    ├── expense.test.ts → mock Prisma
    └── message.test.ts → mock services ทั้งหมด
```

### วิธีคิด: Mock External Dependency ทั้งหมด

**ทำไมต้อง mock?**

#### 1. ความเร็ว

- Test ที่ต่อ database จริง → ใช้เวลา**เป็นวินาที**
- Mock → ใช้เวลา **millisecond**

```
Real DB: 1000 tests × 500ms = 500 วินาที (8 นาที)
Mock:    1000 tests × 5ms   = 5 วินาที
```

#### 2. ความเสถียร

Test ไม่ควรล้มเพราะ:

- Network มีปัญหา
- Database มีปัญหา
- External API มีปัญหา

```typescript
// ❌ ไม่เสถียร - ต่อ AI จริง
test("should parse expense", async () => {
  const result = await parseExpenseMessage("กินข้าว 120");
  // ถ้า AI service ล่ม → test fail
});

// ✅ เสถียร - mock AI
test("should parse expense", async () => {
  mockAI.parse.mockResolvedValue({ type: "EXPENSE", amount: 120 });
  const result = await parseExpenseMessage("กินข้าว 120");
  expect(result.amount).toBe(120);
});
```

#### 3. Control

Mock ทำให้จำลอง **error case** ได้ง่าย:

```typescript
// จำลอง AI timeout
mockAI.parse.mockRejectedValue(new Error("Timeout"));

// จำลอง database crash
mockPrisma.expense.create.mockRejectedValue(new Error("Connection lost"));

// จำลอง LINE API error
mockLINE.replyMessage.mockRejectedValue(new Error("Invalid token"));
```

### แนวคิดสำคัญ: Test Behavior ไม่ใช่ Implementation

**❌ ไม่ดี - test implementation:**

```typescript
test("should call getMonthlySummary with correct params", async () => {
  await processMessage(userId, "สรุป", replyToken);
  expect(getMonthlySummary).toHaveBeenCalledWith(userId);
});
// ถ้าเปลี่ยน implementation ต้องแก้ test
```

**✅ ดี - test behavior:**

```typescript
test("should return summary when user sends 'สรุป'", async () => {
  await processMessage(userId, "สรุป", replyToken);
  expect(mockReplyText).toHaveBeenCalledWith(
    replyToken,
    expect.stringContaining("รายจ่ายทั้งหมด")
  );
});
// เปลี่ยน implementation ยังไง test ก็ยังผ่าน (ถ้า behavior เหมือนเดิม)
```

---

## 📊 ภาพรวม Flow ทั้งหมด

### 1. Startup

```
config valid?
  → connect DB
    → start server
      → ready to receive requests
```

### 2. Request เข้า

```
security headers
  → rate limit
    → parse body
      → route
```

### 3. /webhook

```
verify signature
  → validate payload
    → ตอบ OK ทันที
      → process async
```

### 4. Process async

```
เช็ค command
  → AI parse (ถ้าต้องการ)
    → save DB
      → reply LINE
```

### 5. Error

```
operational → warn + return error response
unexpected  → error + stack trace + return 500
```

### 6. Shutdown

```
รอ request เสร็จ
  → disconnect DB
    → exit gracefully
```

---

## 🎯 Key Principles

### 1. Fail Fast

ตรวจสอบ config และ dependencies ก่อนรับ traffic

### 2. Defense in Depth

หลายชั้นความปลอดภัย: signature verify + rate limit + validation

### 3. Graceful Degradation

AI fail → ใช้ fallback parser  
Timeout → ตอบ OK ก่อนแล้วค่อยประมวลผล

### 4. Separation of Concerns

แต่ละ layer ทำหน้าที่ชัดเจน ไม่ปนกัน

### 5. Type Safety

TypeScript + Zod + Prisma = type-safe ทั้งระบบ

### 6. Testability

Factory pattern + dependency injection = mock ง่าย

### 7. Observability

Structured logging + meaningful error messages

---

## 💡 Design Trade-offs

### 1. Memory vs SQL Aggregate

**เลือก:** คำนวณใน memory  
**Trade-off:** ใช้ memory มากกว่า แต่ code ง่ายกว่า  
**Reason:** ข้อมูลไม่มาก (< 1000 records/user/month)

### 2. Immediate Response vs Complete Processing

**เลือก:** ตอบ LINE ทันที แล้วค่อย process  
**Trade-off:** user ไม่เห็น real-time error แต่ไม่ timeout  
**Reason:** LINE timeout 30s + AI อาจช้า

### 3. AI Provider Flexibility vs Simplicity

**เลือก:** Factory pattern รองรับหลาย provider  
**Trade-off:** code ซับซ้อนขึ้นนิดหน่อย แต่เปลี่ยน provider ได้ง่าย  
**Reason:** AI landscape เปลี่ยนเร็ว ต้องมี flexibility

### 4. Upsert vs Find-then-Create

**เลือก:** Upsert  
**Trade-off:** ไม่รู้ว่า created หรือ updated แต่ป้องกัน race condition  
**Reason:** Correctness > Observability

### 5. JSON Logging vs Human Readable

**เลือก:** JSON สำหรับ production  
**Trade-off:** อ่านยากกว่า แต่ query ง่ายกว่า  
**Reason:** Production ต้อง aggregate และ alert → ต้องใช้ structured log

---

## 🔮 Future Considerations

### 1. เมื่อ User เยอะขึ้น

- เพิ่ม Redis cache สำหรับ monthly summary
- ใช้ SQL aggregate แทน memory calculation
- Horizontal scaling (หลาย instance)

### 2. เมื่อ Feature เยอะขึ้น

- แยก services เป็น microservices
- ใช้ message queue (RabbitMQ, Kafka) แทน fire-and-forget
- เพิ่ม retry mechanism

### 3. เมื่อต้อง Multi-tenant

- เพิ่ม Organization model
- Row-level security
- Separate database per tenant (ถ้าต้องการ isolation สูง)

### 4. เมื่อต้อง Real-time

- WebSocket สำหรับ dashboard
- Server-sent events
- Change data capture (CDC) จาก database

---

## 📚 สรุป

เอกสารนี้อธิบาย**เหตุผล**เบื้องหลังการออกแบบทุกส่วน ไม่ใช่แค่อธิบายว่า**ทำอะไร**

**Key Takeaways:**

1. ทุก decision มีเหตุผล ไม่ใช่ทำเพราะ "best practice" หรือ "คนอื่นทำ"
2. มี trade-off เสมอ เลือกตามบริบทของปัญหา
3. Simple is better than complex แต่ correct is better than simple
4. Optimize for maintainability ไม่ใช่ premature optimization

**อ่านต่อ:**

- [📚 Architecture Documentation](./ARCHITECTURE.md) - รายละเอียดทางเทคนิค
- [🎓 Workshop Guide](./WORKSHOP.md) - เรียนรู้แบบ hands-on
- [🧪 Testing Guide](./TESTING_GUIDE.md) - วิธีเขียน tests
