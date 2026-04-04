# 🎓 Workshop Guide - สร้าง Expense Bot จากศูนย์

คู่มือนี้จะพาคุณสร้าง LINE Bot บันทึกรายรับ-รายจ่ายแบบ step-by-step เหมาะสำหรับผู้เริ่มต้น

---

## 🎯 สิ่งที่จะได้เรียนรู้

1. ตั้งค่า Express.js server พร้อม TypeScript
2. เชื่อมต่อ LINE Messaging API
3. ใช้ Google Gemini AI แปลงข้อความ
4. เก็บข้อมูลด้วย PostgreSQL + Prisma
5. ทำ Security และ Error Handling
6. Deploy production

**เวลาโดยประมาณ:** 3-4 ชั่วโมง

---

## 📚 Module 1: Project Setup (30 นาที)

### 1.1 สร้างโปรเจ็คใหม่

```bash
mkdir expense-bot
cd expense-bot
npm init -y
```

### 1.2 ติดตั้ง Dependencies

```bash
# Runtime dependencies
npm install express @line/bot-sdk @google/generative-ai
npm install @prisma/client @prisma/adapter-pg pg
npm install dotenv zod helmet express-rate-limit winston

# Dev dependencies
npm install -D typescript @types/node @types/express
npm install -D ts-node nodemon prisma
npm install -D jest @types/jest ts-jest
```

### 1.3 ตั้งค่า TypeScript

สร้างไฟล์ `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.4 ตั้งค่า Scripts

แก้ไข `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  }
}
```

### ✅ Checkpoint 1

- [ ] สร้างโปรเจ็คสำเร็จ
- [ ] ติดตั้ง dependencies ครบ
- [ ] มี `tsconfig.json` และ `package.json`

---

## 📚 Module 2: Environment & Config (20 นาที)

### 2.1 สร้างไฟล์ `.env.example`

```env
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
AI_PROVIDER=google
GOOGLE_API_KEY=
DATABASE_URL=postgresql://postgres:password@localhost:5432/expensebot
PORT=3000
NODE_ENV=development
```

### 2.2 สร้าง Config Validator

สร้างไฟล์ `src/config/index.ts`:

```typescript
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  LINE_CHANNEL_SECRET: z.string().min(1),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  AI_PROVIDER: z.enum(["google"]).default("google"),
  GOOGLE_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
```

### 🎓 เรียนรู้

- **Zod** ช่วยตรวจสอบและ validate environment variables
- ถ้า config ไม่ถูกต้อง app จะไม่รัน (fail fast)

### ✅ Checkpoint 2

- [ ] มีไฟล์ `.env` (copy จาก `.env.example`)
- [ ] `src/config/index.ts` สร้างเสร็จ
- [ ] เข้าใจการทำงานของ Zod

---

## 📚 Module 3: Database Setup (30 นาที)

### 3.1 ตั้งค่า Prisma

```bash
npx prisma init
```

### 3.2 สร้าง Schema

แก้ไข `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

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

  @@unique([userId, name])
}

enum ExpenseType {
  INCOME
  EXPENSE
}
```

### 3.3 สร้าง Database และ Run Migration

```bash
# สร้าง database ใน PostgreSQL
createdb expensebot

# Run migration
npx prisma migrate dev --name init

# เปิด Prisma Studio (GUI)
npx prisma studio
```

### 3.4 สร้าง Prisma Client

สร้างไฟล์ `src/db/prisma.ts`:

```typescript
import { PrismaClient } from "../generated/prisma";

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});
```

### 🎓 เรียนรู้

- **Prisma** คือ ORM ที่ให้ type-safe database queries
- Migration คือการเปลี่ยนแปลง database schema
- Prisma Studio คือ GUI สำหรับดูข้อมูล

### ✅ Checkpoint 3

- [ ] Database `expensebot` ถูกสร้างแล้ว
- [ ] Migration รันสำเร็จ
- [ ] เปิด Prisma Studio ได้

---

## 📚 Module 4: Basic Express Server (30 นาที)

### 4.1 สร้าง Logger

สร้างไฟล์ `src/utils/logger.ts`:

```typescript
import winston from "winston";
import { config } from "../config";

export const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
```

### 4.2 สร้าง Express App

สร้างไฟล์ `src/app.ts`:

```typescript
import express from "express";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return app;
}
```

### 4.3 สร้าง Entry Point

สร้างไฟล์ `src/index.ts`:

```typescript
import { createApp } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { prisma } from "./db/prisma";

async function main() {
  await prisma.$connect();
  logger.info("Database connected ✅");

  const app = createApp();

  app.listen(config.PORT, () => {
    logger.info("Server running 🚀", { port: config.PORT });
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
```

### 4.4 ทดสอบรัน Server

```bash
npm run dev
```

เปิดเบราว์เซอร์: `http://localhost:3000/health`

### ✅ Checkpoint 4

- [ ] Server รันได้
- [ ] `/health` ตอบกลับสำเร็จ
- [ ] เห็น logs ใน console

---

## 📚 Module 5: LINE Webhook Integration (45 นาที)

### 5.1 สร้าง Error Classes

สร้างไฟล์ `src/utils/errors.ts`:

```typescript
export class AppError extends Error {
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

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}
```

### 5.2 สร้าง LINE Signature Verification

สร้างไฟล์ `src/middleware/lineSignature.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config";
import { UnauthorizedError } from "../utils/errors";

export function verifyLineSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signature = req.headers["x-line-signature"] as string;

  if (!signature) {
    return next(new UnauthorizedError("Missing LINE signature"));
  }

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", config.LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");

  const isValid =
    Buffer.from(signature).length === Buffer.from(expectedSignature).length &&
    crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

  if (!isValid) {
    return next(new UnauthorizedError("Invalid LINE signature"));
  }

  next();
}
```

### 5.3 สร้าง Webhook Handler

สร้างไฟล์ `src/handlers/message.ts`:

```typescript
import { z } from "zod";
import { Request, Response } from "express";
import { logger } from "../utils/logger";

const lineWebhookSchema = z.object({
  events: z.array(
    z.object({
      type: z.string(),
      replyToken: z.string().optional(),
      source: z.object({
        userId: z.string().optional(),
      }),
      message: z
        .object({
          type: z.string(),
          text: z.string().optional(),
        })
        .optional(),
    })
  ),
});

export async function webhookHandler(req: Request, res: Response) {
  logger.info("Webhook received");

  const result = lineWebhookSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  res.json({ status: "ok" });

  const { events } = result.data;
  for (const event of events) {
    if (event.type === "message" && event.message?.type === "text") {
      logger.info("Text message", { text: event.message.text });
    }
  }
}
```

### 5.4 เพิ่ม Webhook Route

แก้ไข `src/app.ts`:

```typescript
import { verifyLineSignature } from "./middleware/lineSignature";
import { webhookHandler } from "./handlers/message";

// เพิ่มใน createApp()
app.post("/webhook", verifyLineSignature, webhookHandler);
```

### ✅ Checkpoint 5

- [ ] Webhook endpoint พร้อมใช้งาน
- [ ] Signature verification ทำงาน
- [ ] ลองส่ง test request ด้วย Postman

---

## 📚 Module 6: AI Integration (40 นาที)

### 6.1 สร้าง Types

สร้างไฟล์ `src/types/index.ts`:

```typescript
export interface ParsedExpense {
  type: "INCOME" | "EXPENSE" | "UNKNOWN";
  amount: number | null;
  description: string;
  category: string;
}
```

### 6.2 สร้าง AI Prompt

สร้างไฟล์ `src/services/ai/prompt.ts`:

```typescript
export const SYSTEM_PROMPT = `คุณคือผู้ช่วยวิเคราะห์รายรับ-รายจ่าย ตอบเป็น JSON เท่านั้น
{
  "type": "INCOME" | "EXPENSE" | "UNKNOWN",
  "amount": number | null,
  "description": "รายละเอียด",
  "category": "หมวดหมู่"
}
หมวดหมู่: อาหาร, เดินทาง, ช้อปปิ้ง, บันเทิง, สุขภาพ, ที่พัก, สาธารณูปโภค, เงินเดือน, รายได้อื่น, อื่นๆ`;
```

### 6.3 สร้าง Google Provider

สร้างไฟล์ `src/services/google.ts`:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedExpense } from "../types";
import { SYSTEM_PROMPT } from "./ai/prompt";
import { logger } from "../utils/logger";

export class GoogleProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async parseExpense(text: string): Promise<ParsedExpense> {
    try {
      const model = this.client.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const prompt = `${SYSTEM_PROMPT}\n\nUser message: ${text}`;
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      return JSON.parse(raw);
    } catch (err) {
      logger.error("AI parsing failed", { error: err });
      return {
        type: "UNKNOWN",
        amount: null,
        description: text,
        category: "อื่นๆ",
      };
    }
  }
}
```

### 6.4 ทดสอบ AI

สร้างไฟล์ทดสอบ `test-ai.ts`:

```typescript
import { GoogleProvider } from "./src/services/google";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleProvider(process.env.GOOGLE_API_KEY!);

async function test() {
  const result = await ai.parseExpense("กินข้าว 120");
  console.log(result);
}

test();
```

รัน: `npx ts-node test-ai.ts`

### ✅ Checkpoint 6

- [ ] Google AI provider ทำงาน
- [ ] ทดสอบ parse ข้อความสำเร็จ
- [ ] เข้าใจ AI prompt engineering

---

## 📚 Module 7: Database Operations (40 นาที)

### 7.1 สร้าง Expense Service

สร้างไฟล์ `src/services/expense.ts`:

```typescript
import { prisma } from "../db/prisma";
import { ParsedExpense } from "../types";

export async function getOrCreateUser(lineUserId: string) {
  return prisma.user.upsert({
    where: { lineUserId },
    update: {},
    create: { lineUserId },
  });
}

async function getOrCreateCategory(userId: string, name: string) {
  return prisma.category.upsert({
    where: { userId_name: { userId, name } },
    update: {},
    create: { userId, name },
  });
}

export async function saveExpense(lineUserId: string, parsed: ParsedExpense) {
  const user = await getOrCreateUser(lineUserId);
  const category = await getOrCreateCategory(user.id, parsed.category);

  return prisma.expense.create({
    data: {
      userId: user.id,
      amount: parsed.amount!,
      description: parsed.description,
      categoryId: category.id,
      type: parsed.type as "INCOME" | "EXPENSE",
    },
  });
}

export async function getMonthlySummary(lineUserId: string) {
  const user = await getOrCreateUser(lineUserId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      date: { gte: startOfMonth },
    },
    include: { category: true },
  });

  const totalIncome = expenses
    .filter((e) => e.type === "INCOME")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = expenses
    .filter((e) => e.type === "EXPENSE")
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}
```

### ✅ Checkpoint 7

- [ ] `saveExpense` ทำงาน
- [ ] `getMonthlySummary` ทำงาน
- [ ] เข้าใจ Prisma queries

---

## 📚 Module 8: Complete Integration (45 นาที)

### 8.1 สร้าง LINE Service

สร้างไฟล์ `src/services/line.ts`:

```typescript
import { Client } from "@line/bot-sdk";
import { config } from "../config";

export const lineClient = new Client({
  channelAccessToken: config.LINE_CHANNEL_ACCESS_TOKEN,
});

export async function replyText(replyToken: string, text: string) {
  await lineClient.replyMessage(replyToken, { type: "text", text });
}
```

### 8.2 อัพเดต Webhook Handler

แก้ไข `src/handlers/message.ts` เพิ่มฟังก์ชัน:

```typescript
import { GoogleProvider } from "../services/google";
import { saveExpense, getMonthlySummary } from "../services/expense";
import { replyText } from "../services/line";
import { config } from "../config";

const ai = new GoogleProvider(config.GOOGLE_API_KEY!);

async function processMessage(
  userId: string,
  text: string,
  replyToken: string
) {
  if (text === "สรุป") {
    const summary = await getMonthlySummary(userId);
    return replyText(
      replyToken,
      `รายรับ: ${summary.totalIncome}\nรายจ่าย: ${summary.totalExpense}\nคงเหลือ: ${summary.balance}`
    );
  }

  const parsed = await ai.parseExpense(text);

  if (parsed.type === "UNKNOWN") {
    return replyText(replyToken, "ไม่เข้าใจค่ะ ลองใหม่นะคะ");
  }

  await saveExpense(userId, parsed);
  return replyText(
    replyToken,
    `บันทึก${parsed.type === "INCOME" ? "รายรับ" : "รายจ่าย"}แล้ว: ${parsed.amount} บาท`
  );
}

// เพิ่มใน webhookHandler
for (const event of events) {
  if (event.type === "message" && event.message?.type === "text") {
    await processMessage(
      event.source.userId!,
      event.message.text!,
      event.replyToken!
    );
  }
}
```

### ✅ Checkpoint 8

- [ ] ส่งข้อความผ่าน LINE ได้
- [ ] AI แปลงข้อความสำเร็จ
- [ ] บันทึก database สำเร็จ
- [ ] ตอบกลับใน LINE สำเร็จ

---

## 📚 Module 9: Security & Production (30 นาที)

### 9.1 เพิ่ม Security Middleware

สร้างไฟล์ `src/middleware/security.ts`:

```typescript
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export const securityHeaders = helmet();

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
});
```

### 9.2 อัพเดต App

แก้ไข `src/app.ts`:

```typescript
import {
  securityHeaders,
  generalLimiter,
  webhookLimiter,
} from "./middleware/security";

app.use(securityHeaders);
app.use(generalLimiter);

app.post("/webhook", webhookLimiter, verifyLineSignature, webhookHandler);
```

### 9.3 Graceful Shutdown

แก้ไข `src/index.ts`:

```typescript
const server = app.listen(config.PORT, () => {
  logger.info("Server running 🚀");
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

### ✅ Checkpoint 9

- [ ] Security headers ทำงาน
- [ ] Rate limiting ทำงาน
- [ ] Graceful shutdown ทำงาน

---

## 🚀 สรุป & ขั้นตอนถัดไป

### สิ่งที่ทำได้แล้ว

✅ Express + TypeScript server  
✅ PostgreSQL + Prisma ORM  
✅ LINE webhook integration  
✅ Google Gemini AI parsing  
✅ Security middleware  
✅ Error handling  
✅ Logging

### แนะนำให้ทำต่อ

1. **Testing** - เพิ่ม unit tests และ integration tests
2. **Fallback Parser** - สร้าง regex parser เมื่อ AI fail
3. **Rich Menu** - เพิ่ม quick actions ใน LINE
4. **Analytics** - เพิ่มกราฟและ insights
5. **Deploy** - Deploy บน Railway, Render, หรือ Heroku

### แหล่งเรียนรู้เพิ่มเติม

- [Prisma Docs](https://www.prisma.io/docs)
- [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/)
- [Google Gemini Docs](https://ai.google.dev/docs)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

🎉 **ยินดีด้วย! คุณสร้าง Expense Bot สำเร็จแล้ว**
