# 🏗️ Architecture Documentation

เอกสารนี้อธิบายสถาปัตยกรรมของระบบ Expense Bot แบบละเอียด เหมาะสำหรับนักพัฒนาที่ต้องการเข้าใจการทำงานของระบบ

---

## 📐 System Overview

### High-Level Architecture

```
┌─────────────┐
│  LINE User  │
└──────┬──────┘
       │ ข้อความ
       ↓
┌──────────────────────┐
│   LINE Platform      │
│   Messaging API      │
└──────┬───────────────┘
       │ Webhook (POST /webhook)
       ↓
┌──────────────────────────────────┐
│      Expense Bot Server          │
│  ┌────────────────────────────┐  │
│  │  1. Security Layer         │  │
│  │     - Signature Verify     │  │
│  │     - Rate Limiting        │  │
│  │     - Security Headers     │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  2. Message Handler        │  │
│  │     - Parse & Validate     │  │
│  │     - Route Commands       │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  3. Business Logic         │  │
│  │     - AI Service           │  │
│  │     - Expense Service      │  │
│  │     - LINE Service         │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  4. Data Layer             │  │
│  │     - Prisma ORM           │  │
│  └────────────────────────────┘  │
└───────────┬──────────────────────┘
            │
            ↓
    ┌───────────────┐
    │  PostgreSQL   │
    │   Database    │
    └───────────────┘
            ↑
            │
    ┌───────────────┐
    │  Google AI    │
    │  Gemini API   │
    └───────────────┘
```

---

## 📂 Directory Structure

```
src/
├── index.ts                    # Entry point - start server
├── app.ts                      # Express app configuration
│
├── config/                     # Configuration management
│   └── index.ts               # Env validation with Zod
│
├── db/                         # Database layer
│   └── prisma.ts              # Prisma client with singleton, logging, monitoring
│
├── middleware/                 # Express middlewares
│   ├── security.ts            # Helmet + Rate limiting
│   ├── lineSignature.ts       # LINE webhook verification
│   └── errorHandler.ts        # Global error handler
│
├── handlers/                   # Request handlers
│   └── message.ts             # Webhook message handler
│
├── services/                   # Business logic
│   ├── index.ts               # AI service factory
│   ├── google.ts              # Google Gemini provider
│   ├── fallback.ts            # Regex parser fallback
│   ├── expense.ts             # Expense CRUD operations
│   ├── line.ts                # LINE messaging functions
│   ├── types.ts               # AI provider interface
│   └── ai/
│       └── prompt.ts          # AI system prompt
│
├── types/                      # TypeScript types
│   └── index.ts               # Shared interfaces
│
└── utils/                      # Utilities
    ├── logger.ts              # Winston logger
    └── errors.ts              # Custom error classes
```

---

## 🔄 Request Flow

### 1. ผู้ใช้ส่งข้อความ

```
User (LINE) → "กินข้าว 120"
```

### 2. LINE Platform ส่ง Webhook

```http
POST https://your-server.com/webhook
Content-Type: application/json
X-Line-Signature: xxx...

{
  "events": [
    {
      "type": "message",
      "replyToken": "xxx...",
      "source": { "userId": "U123..." },
      "message": { "type": "text", "text": "กินข้าว 120" }
    }
  ]
}
```

### 3. Server รับ Request ผ่าน Middleware Chain

```typescript
// 1. Trust Proxy (app.ts:16)
app.set("trust proxy", 1);

// 2. Security Headers (app.ts:19)
helmet(); // X-Frame-Options, CSP, etc.

// 3. General Rate Limiter (app.ts:22)
// 100 requests / 15 minutes

// 4. JSON Parser (app.ts:25)
express.json();

// 5. Webhook Endpoint (app.ts:36-45)
app.post(
  "/webhook",
  webhookLimiter, // 300 req/min
  verifyLineSignature, // Verify HMAC
  asyncHandler(webhookHandler)
);
```

### 4. Signature Verification

```typescript
// middleware/lineSignature.ts
const signature = req.headers["x-line-signature"];
const body = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac("sha256", LINE_CHANNEL_SECRET)
  .update(body)
  .digest("base64");

// Timing-safe comparison
crypto.timingSafeEqual(signature, expectedSignature);
```

**วัตถุประสงค์:** ป้องกันการปลอมแปลง request จากแหล่งที่ไม่ใช่ LINE

### 5. Message Handler

```typescript
// handlers/message.ts:59-121

// Validate payload structure
lineWebhookSchema.safeParse(req.body)

// ตอบ LINE ทันที (< 30s timeout)
res.json({ status: "ok" })

// ประมวลผล async
await Promise.allSettled(
  events.map(event => processMessage(...))
)
```

**Pattern:** Fire-and-forget

- ตอบ LINE ก่อนเพื่อไม่ timeout
- ประมวลผลหลังแบบ async
- ใช้ `Promise.allSettled` เพื่อให้ event อื่นทำงานต่อแม้มี error

### 6. Process Message

```typescript
// handlers/message.ts:123-166

async function processMessage(userId, text, replyToken) {
  // Check commands
  if (text === "สรุป") {
    const summary = await getMonthlySummary(userId);
    return replyText(replyToken, formatSummaryMessage(summary));
  }

  // AI parsing
  const parsed = await parseExpenseMessage(text);

  // Save to DB
  await saveExpense(userId, parsed);

  // Reply confirmation
  return replyText(replyToken, "บันทึกแล้ว...");
}
```

### 7. AI Service (Factory Pattern)

```typescript
// services/index.ts:11-31

function createAIProvider(): AIProvider {
  switch (config.AI_PROVIDER) {
    case "google":
      return new GoogleProvider(config.GOOGLE_API_KEY);
    // case "openai": return new OpenAIProvider(...)
    // case "anthropic": return new AnthropicProvider(...)
  }
}

const aiProvider = createAIProvider(); // Singleton
```

**Benefits:**

- เปลี่ยน AI provider ได้ง่าย (แค่เปลี่ยน env)
- ทุก provider implement interface เดียวกัน
- มี fallback parser เมื่อ AI fail

### 8. Google Gemini Provider

```typescript
// services/google.ts:15-33

async parseExpense(text: string): Promise<ParsedExpense> {
  const model = this.client.getGenerativeModel({
    model: "gemini-2.5-flash"
  })

  const prompt = `${SYSTEM_PROMPT}\n\nUser message: ${text}`
  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  return JSON.parse(raw) // { type, amount, description, category }
}
```

**AI Prompt:**

```
คุณคือผู้ช่วยวิเคราะห์รายรับ-รายจ่าย ตอบเป็น JSON เท่านั้น
{
  "type": "INCOME" | "EXPENSE" | "UNKNOWN",
  "amount": number | null,
  "description": "รายละเอียด",
  "category": "หมวดหมู่"
}
```

### 9. Fallback Parser (Regex)

```typescript
// services/fallback.ts:8-70

export function parseFallback(text: string): ParsedExpense {
  // Extract amount
  const amount = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);

  // Detect income/expense
  const incomeKeywords = ["รับ", "ได้", "โบนัส"];
  const isIncome = incomeKeywords.some((k) => text.includes(k));

  // Detect category
  const categoryMap = {
    กิน: "อาหาร",
    รถ: "เดินทาง",
    bts: "เดินทาง",
  };

  return { type, amount, description, category };
}
```

**Use Case:** เมื่อ AI service ล่ม หรือ API quota หมด

### 10. Save to Database

```typescript
// services/expense.ts:21-46

async function saveExpense(lineUserId, parsed) {
  // 1. Get or create user
  const user = await prisma.user.upsert({
    where: { lineUserId },
    update: {},
    create: { lineUserId },
  });

  // 2. Get or create category
  const category = await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: parsed.category } },
    update: {},
    create: { userId: user.id, name: parsed.category },
  });

  // 3. Create expense
  await prisma.expense.create({
    data: {
      userId: user.id,
      amount: parsed.amount,
      description: parsed.description,
      categoryId: category.id,
      type: parsed.type,
    },
  });
}
```

**Pattern:** Upsert

- ไม่ต้องเช็คว่ามีอยู่แล้วหรือไม่
- สร้างใหม่ถ้ายังไม่มี
- ไม่ทำอะไรถ้ามีแล้ว

### 11. Reply to LINE

```typescript
// services/line.ts:11-18

async function replyText(replyToken: string, text: string) {
  await lineClient.replyMessage(replyToken, {
    type: "text",
    text,
  });
}
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌──────────────┐
│    User      │
├──────────────┤
│ id           │──┐
│ lineUserId   │  │ 1:N
│ name         │  │
│ createdAt    │  │
└──────────────┘  │
                  │
       ┌──────────┴──────────┐
       │                     │
       ↓                     ↓
┌──────────────┐      ┌──────────────┐
│  Expense     │      │  Category    │
├──────────────┤      ├──────────────┤
│ id           │      │ id           │
│ userId       │──┐   │ userId       │
│ amount       │  │   │ name         │
│ description  │  │   │ icon         │
│ categoryId   │──┼──→│ createdAt    │
│ type         │  │   └──────────────┘
│ date         │  │
│ createdAt    │  │
└──────────────┘  │
                  │
                  │ 1:N
                  ↓
           ┌──────────────┐
           │ExpenseType   │
           │ (enum)       │
           ├──────────────┤
           │ INCOME       │
           │ EXPENSE      │
           └──────────────┘
```

### Schema Definition

```prisma
model User {
  id         String     @id @default(cuid())
  lineUserId String     @unique
  name       String?
  expenses   Expense[]
  categories Category[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model Expense {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  amount      Float
  description String
  categoryId  String?
  category    Category?   @relation(fields: [categoryId], references: [id])
  type        ExpenseType
  date        DateTime    @default(now())
  createdAt   DateTime    @default(now())
}

model Category {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  name      String
  icon      String?
  expenses  Expense[]
  createdAt DateTime  @default(now())

  @@unique([userId, name])  // ป้องกันชื่อซ้ำต่อ user
}

enum ExpenseType {
  INCOME
  EXPENSE
}
```

### Key Design Decisions

1. **CUID vs UUID**
   - ใช้ `cuid()` แทน `uuid()`
   - CUID สั้นกว่า, sortable, collision-resistant

2. **Soft Delete**
   - ไม่มี `deletedAt` field
   - ถ้าต้องการ soft delete: เพิ่ม `deletedAt DateTime?`

3. **Unique Constraint**
   - `@@unique([userId, name])` ใน Category
   - user แต่ละคนมี category ชื่อเดียวกันได้แค่ 1 อัน

4. **Relations**
   - User → Expenses (1:N)
   - User → Categories (1:N)
   - Category → Expenses (1:N)
   - Expense → User (N:1)
   - Expense → Category (N:1 optional)

---

## 🔒 Security Layers

### 1. Signature Verification

**Purpose:** ยืนยันว่า request มาจาก LINE จริง

```typescript
const signature = req.headers["x-line-signature"];
const body = JSON.stringify(req.body);

const hash = crypto
  .createHmac("sha256", LINE_CHANNEL_SECRET)
  .update(body)
  .digest("base64");

// Timing-safe comparison (ป้องกัน timing attack)
crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
```

**Threat:** Replay attack, forged requests

### 2. Rate Limiting

**General Limiter:**

```typescript
rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 100, // 100 requests
});
```

**Webhook Limiter:**

```typescript
rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 300, // 300 requests
});
```

**Threat:** DDoS, brute force

### 3. Security Headers (Helmet)

```typescript
helmet({
  contentSecurityPolicy: false, // ปิดเพราะไม่ได้ serve HTML
});
```

Headers ที่ถูกตั้ง:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=15552000`
- `X-DNS-Prefetch-Control: off`

**Threat:** Clickjacking, MIME sniffing, XSS

### 4. Trust Proxy

```typescript
app.set("trust proxy", 1);
```

**Purpose:** ให้ Express ใช้ IP จาก `X-Forwarded-For` header
**Requirement:** เมื่อรันหลัง reverse proxy (nginx, ngrok, cloud LB)

---

## ⚠️ Error Handling

### Error Class Hierarchy

```
Error
  └── AppError
        ├── ValidationError (400)
        ├── UnauthorizedError (401)
        ├── NotFoundError (404)
        └── ExternalServiceError (503)
```

### Custom Error Classes

```typescript
// utils/errors.ts

class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}
```

### Global Error Handler

```typescript
// middleware/errorHandler.ts

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Unexpected errors
  logger.error("Unexpected error", { error: err });
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
```

### Async Error Wrapper

```typescript
export const asyncHandler = (fn: (req, res, next) => Promise<any>) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage
app.post("/webhook", asyncHandler(webhookHandler));
```

**Purpose:** ห่อ async function ให้ส่ง error ไป error handler อัตโนมัติ

---

## 📝 Logging Strategy

### Winston Logger

```typescript
// utils/logger.ts

const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
```

### Log Levels

- **error** - Errors ที่ต้องแก้ด่วน
- **warn** - Warnings, failed requests
- **info** - สถานะปกติของระบบ
- **debug** - ข้อมูลละเอียดสำหรับ development

### Structured Logging

```typescript
logger.info("Expense saved", {
  userId: user.id,
  amount: 120,
  type: "EXPENSE",
  category: "อาหาร",
});

// Output:
// {
//   "level": "info",
//   "message": "Expense saved",
//   "userId": "cld123...",
//   "amount": 120,
//   "type": "EXPENSE",
//   "category": "อาหาร",
//   "timestamp": "2024-03-23T10:00:00.000Z"
// }
```

**Benefits:**

- ค้นหาและ filter ง่าย
- ใช้กับ logging platforms (Datadog, Splunk, ELK)

---

## 🔄 Design Patterns

### 1. Factory Pattern (AI Provider)

```typescript
// services/index.ts

function createAIProvider(): AIProvider {
  switch (config.AI_PROVIDER) {
    case "google": return new GoogleProvider(...)
    case "openai": return new OpenAIProvider(...)
  }
}

const aiProvider = createAIProvider() // Singleton
```

**Benefits:**

- เปลี่ยน provider ได้ง่าย
- ทุก provider implement interface เดียวกัน
- Testable (mock provider ได้ง่าย)

### 2. Repository Pattern (Prisma)

```typescript
// services/expense.ts

export async function getMonthlySummary(lineUserId: string) {
  const user = await getOrCreateUser(lineUserId);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { category: true },
  });

  // Business logic...
}
```

**Benefits:**

- Business logic แยกจาก data access
- เปลี่ยน ORM ได้ง่าย
- Testable (mock repository ได้)

### 3. Middleware Chain

```typescript
app.post(
  "/webhook",
  webhookLimiter, // Rate limit
  verifyLineSignature, // Auth
  asyncHandler(webhookHandler) // Handler
);
```

**Benefits:**

- แยก concerns ชัดเจน
- Reusable middleware
- เพิ่ม/ลด middleware ง่าย

### 4. Error-First Callback → Promise → Async/Await

```typescript
// Old style (callback hell)
fs.readFile("file.txt", (err, data) => {
  if (err) throw err;
  processData(data, (err, result) => {
    if (err) throw err;
    saveData(result, (err) => {
      if (err) throw err;
    });
  });
});

// Modern style (async/await)
try {
  const data = await fs.promises.readFile("file.txt");
  const result = await processData(data);
  await saveData(result);
} catch (err) {
  logger.error("Error", { error: err });
}
```

---

## 🧪 Testing Strategy

### Test Structure

```
src/__tests__/
├── handlers/
│   └── message.test.ts       # Integration tests
├── services/
│   ├── expense.test.ts       # Unit tests
│   └── fallback.test.ts      # Unit tests
└── __mocks__/
    ├── prisma.ts             # Mock Prisma client
    └── line.ts               # Mock LINE client
```

### Unit Test Example

```typescript
// __tests__/services/fallback.test.ts

describe("parseFallback", () => {
  it("should parse expense correctly", () => {
    const result = parseFallback("กินข้าว 120");

    expect(result).toEqual({
      type: "EXPENSE",
      amount: 120,
      description: "กินข้าว",
      category: "อาหาร",
    });
  });

  it("should detect income", () => {
    const result = parseFallback("รับเงินเดือน 30000");
    expect(result.type).toBe("INCOME");
  });
});
```

### Integration Test Example

```typescript
// __tests__/handlers/message.test.ts

describe("webhookHandler", () => {
  it("should process text message", async () => {
    const req = {
      body: {
        events: [
          {
            type: "message",
            replyToken: "xxx",
            source: { userId: "U123" },
            message: { type: "text", text: "กินข้าว 120" },
          },
        ],
      },
    };

    await webhookHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
    expect(mockReplyText).toHaveBeenCalled();
  });
});
```

---

## 🚀 Deployment Considerations

### Environment Variables

**Development:**

```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/expensebot
```

**Production:**

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/db?sslmode=require
```

### Database Migrations

**Development:**

```bash
npm run prisma:migrate  # Create and apply migration
```

**Production:**

```bash
npx prisma migrate deploy  # Apply migrations only
```

### Graceful Shutdown

```typescript
// index.ts:20-31

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down...`);

  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

**Purpose:**

- รอ active requests ทำงานเสร็จก่อน
- ปิด database connection อย่างถูกต้อง
- ป้องกัน data corruption

---

## 📊 Performance Considerations

### 1. Database Indexes

```prisma
model Expense {
  @@index([userId, date])  // Query by user + date range
}

model Category {
  @@unique([userId, name])  // Unique constraint + index
}
```

### 2. Connection Pooling

Prisma จัดการ connection pool อัตโนมัติ:

- Default pool size: 10 connections
- Configurable via `DATABASE_URL`

### 3. Caching Strategy

**Current:** ไม่มี caching
**Future:**

- Redis cache สำหรับ monthly summary
- Cache invalidation เมื่อสร้าง expense ใหม่

### 4. Rate Limiting

ป้องกัน abuse และประหยัด API quota:

- General: 100 req / 15 min
- Webhook: 300 req / min

---

## 🔮 Future Enhancements

### 1. Multi-Provider Support

```typescript
// Support OpenAI, Anthropic
case "openai":
  return new OpenAIProvider(config.OPENAI_API_KEY)
case "anthropic":
  return new AnthropicProvider(config.ANTHROPIC_API_KEY)
```

### 2. Rich Menu

เพิ่ม Rich Menu ใน LINE:

- Quick actions: "สรุป", "ล่าสุด"
- Category shortcuts

### 3. Data Export

Export ข้อมูลเป็น CSV/Excel:

```typescript
GET /export/monthly?userId=xxx&month=2024-03
```

### 4. Budget Tracking

เพิ่ม budget per category:

```prisma
model Category {
  budget Float?
}
```

Alert เมื่อใกล้เกิน budget

### 5. Analytics Dashboard

Web dashboard แสดง:

- Spending trends
- Category breakdown
- Monthly comparison

---

## 🎓 สรุป

### Key Takeaways

1. **Security First** - Signature verification, rate limiting, security headers
2. **Error Handling** - Custom error classes, global handler, structured logging
3. **Clean Architecture** - แยก layers ชัดเจน (handlers, services, data)
4. **Testability** - Factory pattern, dependency injection, mocking
5. **Scalability** - Connection pooling, async processing, graceful shutdown
6. **Maintainability** - TypeScript, Prisma, structured logging

### Best Practices Applied

- ✅ Type-safe with TypeScript
- ✅ ORM with Prisma (type-safe queries)
- ✅ Environment validation with Zod
- ✅ Structured logging with Winston
- ✅ Error handling with custom classes
- ✅ Security layers (helmet, rate limit, signature)
- ✅ Graceful shutdown
- ✅ Factory pattern for AI providers
- ✅ Async error handling
- ✅ Testing setup with Jest

---

📚 **Next Steps:**

- ทำ [Workshop Guide](./WORKSHOP.md) เพื่อเรียนรู้แบบ hands-on
- ศึกษา source code เพิ่มเติม
- ปรับแต่งตามความต้องการ
