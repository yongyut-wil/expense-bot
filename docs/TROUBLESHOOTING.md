# 🔧 Troubleshooting Guide

คู่มือแก้ปัญหาที่พบบ่อยในโปรเจ็ค Expense Bot

---

## 📚 สารบัญ

1. [Database Issues](#database-issues)
2. [LINE Integration Issues](#line-integration-issues)
3. [AI Provider Issues](#ai-provider-issues)
4. [Development Environment Issues](#development-environment-issues)
5. [Deployment Issues](#deployment-issues)
6. [Performance Issues](#performance-issues)
7. [Debugging Tips](#debugging-tips)

---

## Database Issues

### ❌ Connection Error: "Can't reach database server"

**อาการ:**

```
PrismaClientInitializationError: Can't reach database server at localhost:5432
```

**สาเหตุที่เป็นไปได้:**

1. PostgreSQL server ไม่ได้รัน
2. DATABASE_URL ผิด
3. Port ถูกใช้งานโดยโปรแกรมอื่น
4. Firewall block connection

**วิธีแก้:**

```bash
# 1. ตรวจสอบว่า PostgreSQL รันอยู่
# macOS
brew services list | grep postgresql
brew services start postgresql@14

# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# 2. ตรวจสอบ DATABASE_URL
echo $DATABASE_URL
# ต้องเป็น: postgresql://user:password@host:port/database

# 3. ทดสอบ connection
psql -U postgres -h localhost

# 4. ตรวจสอบว่า database มีอยู่
psql -U postgres -c "\l" | grep expensebot

# 5. สร้าง database ถ้ายังไม่มี
createdb expensebot
```

### ❌ Migration Error: "Migration failed"

**อาการ:**

```
Error: Migration `20240101_init` failed
```

**วิธีแก้:**

```bash
# 1. Reset database (Development only!)
npx prisma migrate reset

# 2. Re-run migrations
npx prisma migrate dev

# 3. Generate Prisma client
npx prisma generate

# 4. ตรวจสอบ schema
npx prisma validate
```

### ❌ Prisma Client Error: "PrismaClient is not instantiated"

**อาการ:**

```
PrismaClient is unable to run in production
```

**วิธีแก้:**

```bash
# Generate Prisma client
npx prisma generate

# ใน production ต้อง build ก่อน
npm run build
```

### ❌ Connection Pool Exhausted

**อาการ:**

```
Error: Connection pool timeout
```

**วิธีแก้:**

แก้ไข `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // เพิ่ม connection pool settings
  connection_limit = 10
  pool_timeout = 10
}
```

หรือแก้ใน DATABASE_URL:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10&pool_timeout=10"
```

---

## LINE Integration Issues

### ❌ Webhook Error: "Invalid signature"

**อาการ:**

```
UnauthorizedError: Invalid LINE signature
```

**สาเหตุ:**

1. `LINE_CHANNEL_SECRET` ผิด
2. Request body ถูกแก้ไขก่อนถึง middleware
3. Content-Type ไม่ถูกต้อง

**วิธีแก้:**

```typescript
// 1. ตรวจสอบว่า express.json() อยู่ก่อน webhook route
app.use(express.json());
app.post("/webhook", verifyLineSignature, webhookHandler);

// 2. ตรวจสอบ LINE_CHANNEL_SECRET
console.log(config.LINE_CHANNEL_SECRET); // ต้องไม่ว่าง

// 3. Test signature validation
import crypto from "crypto";

const body = JSON.stringify(req.body);
const signature = crypto
  .createHmac("sha256", config.LINE_CHANNEL_SECRET)
  .update(body)
  .digest("base64");

console.log("Expected:", signature);
console.log("Received:", req.headers["x-line-signature"]);
```

### ❌ Reply Token Error: "Invalid reply token"

**อาการ:**

```
Error: Invalid reply token
```

**สาเหตุ:**

1. Reply token ถูกใช้ไปแล้ว (ใช้ได้ครั้งเดียว)
2. Reply token หมดอายุ (30 วินาที)
3. ใช้ reply token ผิด event

**วิธีแก้:**

```typescript
// ❌ Bad - Reply token used twice
await lineClient.replyMessage(replyToken, message1);
await lineClient.replyMessage(replyToken, message2); // Error!

// ✅ Good - Reply multiple messages
await lineClient.replyMessage(replyToken, [message1, message2]);

// ✅ Good - Use push message for additional messages
await lineClient.replyMessage(replyToken, message1);
await lineClient.pushMessage(userId, message2);
```

### ❌ Webhook Not Receiving Events

**อาการ:**
Webhook endpoint ไม่ได้รับ events จาก LINE

**วิธีแก้:**

```bash
# 1. ตรวจสอบว่า server รันอยู่
curl http://localhost:3000/health

# 2. ตรวจสอบ ngrok
ngrok http 3000

# 3. ตรวจสอบ Webhook URL ใน LINE Developers Console
# URL ต้องเป็น: https://xxxx.ngrok.io/webhook

# 4. ทดสอบ webhook ด้วย LINE Webhook Tester
# https://developers.line.biz/console/
```

### ❌ Rate Limit Exceeded

**อาการ:**

```
Error: API rate limit exceeded
```

**วิธีแก้:**

```typescript
// เพิ่ม retry logic with exponential backoff
async function replyWithRetry(replyToken: string, message: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await lineClient.replyMessage(replyToken, message);
    } catch (error) {
      if (error.statusCode === 429 && i < retries - 1) {
        await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
        continue;
      }
      throw error;
    }
  }
}
```

---

## AI Provider Issues

### ❌ Google Gemini API Error: "API key not valid"

**อาการ:**

```
Error: API key not valid. Please pass a valid API key.
```

**วิธีแก้:**

```bash
# 1. ตรวจสอบ API key
echo $GOOGLE_API_KEY

# 2. ตรวจสอบว่า API key ใช้งานได้
curl https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_API_KEY

# 3. สร้าง API key ใหม่
# https://makersuite.google.com/app/apikey

# 4. Enable Gemini API
# https://console.cloud.google.com/apis/library
```

### ❌ AI Response Parsing Error

**อาการ:**

```
SyntaxError: Unexpected token in JSON at position 0
```

**สาเหตุ:**
AI ตอบกลับไม่เป็น JSON

**วิธีแก้:**

````typescript
async parseExpense(text: string): Promise<ParsedExpense> {
  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    // ลอง clean JSON response
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate response structure
    if (!parsed.type || !parsed.category) {
      throw new Error("Invalid AI response structure");
    }

    return parsed;
  } catch (error) {
    logger.error("AI parsing failed", { error, raw });
    // Fallback to regex parser
    return parseFallback(text);
  }
}
````

### ❌ AI Rate Limit or Quota Exceeded

**อาการ:**

```
Error: Resource exhausted (quota exceeded)
```

**วิธีแก้:**

```typescript
// 1. เพิ่ม retry logic
async function parseWithRetry(text: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await aiProvider.parseExpense(text);
    } catch (error) {
      if (isRateLimitError(error) && i < retries - 1) {
        await sleep(5000); // รอ 5 วินาที
        continue;
      }
      // Fallback to regex parser
      return parseFallback(text);
    }
  }
}

// 2. Cache results
const cache = new Map<string, ParsedExpense>();

async function parseExpense(text: string) {
  const cached = cache.get(text);
  if (cached) return cached;

  const result = await aiProvider.parseExpense(text);
  cache.set(text, result);
  return result;
}
```

---

## Development Environment Issues

### ❌ TypeScript Compilation Errors

**อาการ:**

```
error TS2307: Cannot find module '@prisma/client'
```

**วิธีแก้:**

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Clean build
rm -rf dist node_modules
npm install
npm run build
```

### ❌ Environment Variables Not Loaded

**อาการ:**

```
Error: LINE_CHANNEL_SECRET is required
```

**วิธีแก้:**

```bash
# 1. ตรวจสอบว่ามีไฟล์ .env
ls -la .env

# 2. ตรวจสอบว่า dotenv ถูก load
# src/config/index.ts ต้องมี:
import dotenv from "dotenv";
dotenv.config();

# 3. ตรวจสอบค่า
node -e "require('dotenv').config(); console.log(process.env.LINE_CHANNEL_SECRET)"

# 4. ใช้ .env.local สำหรับ override (git ignored)
cp .env .env.local
```

### ❌ Port Already in Use

**อาการ:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**วิธีแก้:**

```bash
# 1. หา process ที่ใช้ port
lsof -i :3000

# 2. Kill process
kill -9 <PID>

# 3. เปลี่ยน port
# .env
PORT=3001
```

### ❌ Hot Reload Not Working

**อาการ:**
nodemon ไม่ reload เมื่อแก้ไขไฟล์

**วิธีแก้:**

สร้างไฟล์ `nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts", "src/**/*.spec.ts"],
  "exec": "ts-node src/index.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

---

## Deployment Issues

### ❌ Build Fails in Production

**อาการ:**

```
Error: Cannot find module './dist/index.js'
```

**วิธีแก้:**

```bash
# 1. ตรวจสอบ build script
npm run build

# 2. ตรวจสอบว่า dist folder ถูกสร้าง
ls -la dist/

# 3. ตรวจสอบ package.json
{
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}

# 4. Include Prisma in build
{
  "scripts": {
    "build": "prisma generate && tsc"
  }
}
```

### ❌ Database Migration in Production

**อาการ:**
ต้องการ run migrations ใน production

**วิธีแก้:**

```bash
# ❌ NEVER run migrate dev in production
# npx prisma migrate dev

# ✅ Use migrate deploy
npx prisma migrate deploy

# Pre-deployment checklist:
# 1. Backup database
pg_dump -U user -d dbname > backup.sql

# 2. Run migrations
npx prisma migrate deploy

# 3. Verify
npx prisma db pull
```

### ❌ Memory Leak

**อาการ:**
Memory usage เพิ่มขึ้นเรื่อยๆ

**วิธีแก้:**

```typescript
// 1. Disconnect Prisma properly
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// 2. Clear caches
const cache = new LRU({ max: 100 }); // ใช้ LRU cache

// 3. Monitor memory
import v8 from "v8";

setInterval(() => {
  const heap = v8.getHeapStatistics();
  logger.info("Memory usage", {
    used: heap.used_heap_size / 1024 / 1024,
    total: heap.total_heap_size / 1024 / 1024,
  });
}, 60000);
```

### ❌ Environment Variables in Production

**อาการ:**
Environment variables ไม่ถูกโหลดใน production

**วิธีแก้:**

```bash
# ❌ Bad - Don't commit .env to git
git add .env

# ✅ Good - Use platform environment variables
# Railway, Render, Heroku:
# Set via dashboard or CLI

# Railway
railway variables set LINE_CHANNEL_SECRET=xxx

# Render
render env set LINE_CHANNEL_SECRET=xxx

# Heroku
heroku config:set LINE_CHANNEL_SECRET=xxx
```

---

## Performance Issues

### ❌ Slow Database Queries

**อาการ:**
Queries ใช้เวลานาน

**วิธีแก้:**

```typescript
// 1. Enable query logging
const prisma = new PrismaClient({
  log: ["query"],
});

// 2. Add indexes
// prisma/schema.prisma
model Expense {
  @@index([userId, date])
  @@index([categoryId])
}

// 3. Use select to limit fields
const expenses = await prisma.expense.findMany({
  select: {
    id: true,
    amount: true,
    description: true,
    // Don't select unnecessary fields
  },
});

// 4. Avoid N+1 queries
// ❌ Bad
const users = await prisma.user.findMany();
for (const user of users) {
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
  });
}

// ✅ Good
const users = await prisma.user.findMany({
  include: {
    expenses: true,
  },
});
```

### ❌ High Memory Usage

**อาการ:**
Application ใช้ memory มาก

**วิธีแก้:**

```typescript
// 1. Use streaming for large datasets
const stream = await prisma.expense.findMany({
  where: { userId },
  take: 100, // Limit results
});

// 2. Implement pagination
async function getExpenses(page = 1, limit = 20) {
  return prisma.expense.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}

// 3. Clear unused objects
let data = await loadLargeData();
// ... use data
data = null; // Help GC
```

### ❌ Slow AI Responses

**อาการ:**
AI parsing ใช้เวลานาน

**วิธีแก้:**

```typescript
// 1. Set timeout
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const result = await model.generateContent(prompt, {
    signal: controller.signal,
  });
} catch (error) {
  if (error.name === "AbortError") {
    // Timeout - use fallback
    return parseFallback(text);
  }
} finally {
  clearTimeout(timeout);
}

// 2. Use faster models
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // Faster than gemini-2.5-flash
});

// 3. Cache common patterns
const commonPatterns = {
  กินข้าว: { type: "EXPENSE", category: "อาหาร" },
  // ...
};
```

---

## Debugging Tips

### การใช้ Logger อย่างมีประสิทธิภาพ

```typescript
import { logger } from "./utils/logger";

// ❌ Bad - No context
logger.info("Processing message");

// ✅ Good - With context
logger.info("Processing message", {
  userId,
  messageType: event.message.type,
  timestamp: new Date(),
});

// Error logging
try {
  await processMessage(text);
} catch (error) {
  logger.error("Failed to process message", {
    error: error.message,
    stack: error.stack,
    userId,
    text,
  });
}
```

### Debug Mode

```env
# .env
NODE_ENV=development
LOG_LEVEL=debug
```

```typescript
// src/config/index.ts
export const isDebug = config.NODE_ENV === "development";

// src/utils/logger.ts
const logger = winston.createLogger({
  level: config.LOG_LEVEL || (isDebug ? "debug" : "info"),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});
```

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

### Monitoring Production

```typescript
// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      error: error.message,
    });
  }
});

// Metrics endpoint
app.get("/metrics", (req, res) => {
  res.json({
    requests: requestCount,
    errors: errorCount,
    avgResponseTime: avgResponseTime,
  });
});
```

### Common Debug Commands

```bash
# Check logs
tail -f logs/app.log

# Monitor database connections
psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check memory usage
node -e "console.log(process.memoryUsage())"

# Test webhook locally
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "x-line-signature: test" \
  -d '{
    "events": [{
      "type": "message",
      "message": {"type": "text", "text": "test"},
      "source": {"userId": "U123"},
      "replyToken": "token123"
    }]
  }'
```

---

## Quick Reference

### Error Codes

| Code | Meaning                | Action                 |
| ---- | ---------------------- | ---------------------- |
| 400  | Bad Request            | ตรวจสอบ payload        |
| 401  | Unauthorized           | ตรวจสอบ LINE signature |
| 404  | Not Found              | ตรวจสอบ route          |
| 429  | Rate Limited           | เพิ่ม retry logic      |
| 500  | Internal Error         | Check logs             |
| 502  | External Service Error | AI/LINE API down       |
| 503  | Service Unavailable    | Database down          |

### Useful Links

- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [LINE Messaging API Errors](https://developers.line.biz/en/reference/messaging-api/#error-responses)
- [Google AI Error Codes](https://ai.google.dev/docs/errors)

---

## Still Having Issues?

1. **Check Logs** - `logs/app.log`
2. **Enable Debug Mode** - `LOG_LEVEL=debug`
3. **Check GitHub Issues** - Similar problems?
4. **Ask Community** - Stack Overflow, Discord
5. **Open Issue** - Provide logs and steps to reproduce

---

**Remember: Every error is a learning opportunity! 🚀**
