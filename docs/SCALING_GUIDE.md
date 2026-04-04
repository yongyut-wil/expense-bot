# 📈 คู่มือการ Scale Expense Bot

คู่มือฉบับสมบูรณ์สำหรับการเตรียม Expense Bot รองรับผู้ใช้งาน 1,000+ คนพร้อมกัน พร้อมอธิบายแบบละเอียดเหมือนสอน Junior Developer

---

## 📚 สารบัญ

1. [เข้าใจปัญหาก่อน Scale](#เข้าใจปัญหาก่อน-scale)
2. [สถาปัตยกรรมปัจจุบัน](#สถาปัตยกรรมปัจจุบัน)
3. [ปัญหาที่จะเกิดขึ้นเมื่อมี User เยอะ](#ปัญหาที่จะเกิดขึ้นเมื่อมี-user-เยอะ)
4. [แผนการ Scale แบบ Step-by-Step](#แผนการ-scale-แบบ-step-by-step)
5. [Database Scaling](#database-scaling)
6. [Application Scaling](#application-scaling)
7. [Caching Strategy](#caching-strategy)
8. [Message Queue](#message-queue)
9. [AI Service Optimization](#ai-service-optimization)
10. [Monitoring & Alerting](#monitoring--alerting)
11. [Cost Optimization](#cost-optimization)
12. [Migration Plan](#migration-plan)

---

## 🎯 เข้าใจปัญหาก่อน Scale

### สถานการณ์ที่ต้องเจอ

**ปัจจุบัน:** รองรับ user น้อย (10-50 คน)

**เป้าหมาย:** รองรับ user 1,000+ คนพร้อมกัน

**คำนวณ Load:**

```
สมมติ:
- 1,000 users ออนไลน์พร้อมกัน
- แต่ละคนส่งข้อความ 5 ข้อความ/ชั่วโมง
- = 5,000 messages/hour
- = 83 messages/minute
- = 1.4 messages/second (average)

Peak time (เช้า 8-9 โมง, เย็น 6-8 โมง):
- อาจสูงถึง 10x = 14 messages/second
```

### ทำไมต้อง Scale?

1. **Performance** - ตอบสนองเร็วขึ้น (< 2 วินาที)
2. **Availability** - พร้อมใช้งาน 99.9% (downtime < 9 ชม./ปี)
3. **Reliability** - ไม่มี message หาย
4. **Cost Efficiency** - ใช้ทรัพยากรอย่างคุ้มค่า

---

## 🏗️ สถาปัตยกรรมปัจจุบัน

### Current Architecture (Single Server)

```
┌─────────────┐
│   LINE Bot  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   Express Server    │
│  (Single Instance)  │
└──────┬──────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │Google AI │
└──────────┘  └──────────┘
```

### ปัญหาของ Single Server

❌ **Single Point of Failure** - Server ล่มทั้งระบบพัง
❌ **CPU/Memory Limit** - ประมวลผลได้จำกัด
❌ **Database Bottleneck** - DB queries ช้าเมื่อมี concurrent requests เยอะ
❌ **AI API Throttling** - Google AI จำกัด rate limit
❌ **No Caching** - ทุก request hit database

---

## ⚠️ ปัญหาที่จะเกิดขึ้นเมื่อมี User เยอะ

### 1. Database Connection Pool Exhausted

**ปัญหา:**

```typescript
// Prisma default connection pool = 10 connections
// แต่ละ request ใช้ 1 connection
// ถ้ามี 50 concurrent requests → 40 requests ต้องรอ
```

**อาการ:**

- Error: `Timed out fetching a new connection from the connection pool`
- Response time ช้ามาก (> 10 วินาที)

**วิธีแก้:**

- เพิ่ม connection pool
- ใช้ Connection Pooler (PgBouncer)
- Implement caching

### 2. AI API Rate Limiting

**ปัญหา:**

```
Google Gemini API Limits:
- 60 requests/minute (Free tier)
- 1,000 requests/minute (Paid tier)

With 1,000 users:
- 83 requests/minute (average) → OK
- 840 requests/minute (peak) → EXCEED LIMIT
```

**อาการ:**

- Error: `429 Too Many Requests`
- บาง messages ไม่ถูก process

**วิธีแก้:**

- Implement queue system
- Fallback parser (regex) เมื่อ AI ล้น
- Request batching
- Multi-provider support

### 3. Memory Leaks

**ปัญหา:**

```typescript
// In-memory pending transactions
const pendingExpenses = new Map<string, PendingExpense>();

// ถ้า user ไม่ confirm → memory leak
// 1,000 users × 1KB/user = 1MB
// ถ้า leak วันละ 10% → เดือนนึงเต็ม RAM
```

**วิธีแก้:**

- ใช้ Redis แทน in-memory Map
- Set TTL (Time To Live)
- ทำ garbage collection

### 4. Database Query Performance

**ปัญหา:**

```sql
-- ไม่มี index
SELECT * FROM "Expense" WHERE "userId" = 'xxx';
-- Full table scan → ช้ามากเมื่อมีข้อมูลเยอะ
```

**อาการ:**

- Query time > 1 วินาที
- Database CPU 100%

**วิธีแก้:**

- เพิ่ม database indexes
- Optimize queries
- Implement pagination

### 5. No Load Balancing

**ปัญหา:**

- Single server ต้องรับ load ทั้งหมด
- ไม่สามารถ horizontal scaling ได้

**วิธีแก้:**

- Deploy multiple instances
- ใช้ Load Balancer
- Implement stateless architecture

---

## 📋 แผนการ Scale แบบ Step-by-Step

### Phase 1: Quick Wins (1-2 สัปดาห์)

**เป้าหมาย:** รองรับ 100-300 concurrent users

#### 1.1 Database Optimization

```bash
# เพิ่ม indexes ที่สำคัญ
```

```prisma
// prisma/schema.prisma

model Expense {
  id          String   @id @default(cuid())
  userId      String
  amount      Float
  description String?
  date        DateTime
  categoryId  String?

  // ⭐ เพิ่ม indexes
  @@index([userId, date])           // Query by user + date
  @@index([userId, categoryId])     // Query by user + category
  @@index([date])                   // Query by date range
}

model User {
  id         String @id @default(cuid())
  lineUserId String @unique

  // ⭐ unique index ช่วยค้นหาเร็วขึ้น
  @@index([lineUserId])
}
```

**ทำไมต้องทำ:**

- ลด query time จาก 500ms → 50ms
- ลด database CPU usage
- รองรับ concurrent queries ได้มากขึ้น

#### 1.2 Connection Pool Tuning

```typescript
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // ⭐ เพิ่ม connection pool
  connectionLimit = 20  // เพิ่มจาก default 10
}
```

**Environment Variables:**

```bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

#### 1.3 Basic Caching

```bash
npm install ioredis
```

```typescript
// src/config/redis.ts
import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Health check
redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});
```

**Cache User Data:**

```typescript
// src/services/cache.ts
import { redis } from "../config/redis";
import { prisma } from "../config/database";

export async function getCachedUser(lineUserId: string) {
  const cacheKey = `user:${lineUserId}`;

  // 1. ลอง get จาก cache ก่อน
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. ถ้าไม่มี → query จาก database
  const user = await prisma.user.findUnique({
    where: { lineUserId },
  });

  if (user) {
    // 3. เก็บ cache ไว้ 1 ชั่วโมง
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
  }

  return user;
}
```

**ผลลัพธ์:**

- ✅ User lookup เร็วขึ้น 10x (100ms → 10ms)
- ✅ ลด database queries 70-80%
- ✅ รองรับ concurrent requests ได้มากขึ้น

---

### Phase 2: Message Queue (2-3 สัปดาห์)

**เป้าหมาย:** รองรับ 300-700 concurrent users, ไม่มี message หาย

#### 2.1 ทำไมต้องใช้ Message Queue?

**ปัญหาปัจจุบัน:**

```typescript
// Current flow (Synchronous)
app.post("/webhook", async (req, res) => {
  // 1. Verify signature
  // 2. Parse message ← AI อาจช้า (1-3 วินาที)
  // 3. Save to database
  // 4. Reply to LINE
  // ❌ ถ้าขั้นตอน 2 ช้า → timeout
  // ❌ ถ้า AI rate limit → request failed
});
```

**ด้วย Message Queue:**

```typescript
// New flow (Asynchronous)
app.post("/webhook", async (req, res) => {
  // 1. Verify signature
  // 2. Push message to queue ← เร็ว (< 10ms)
  // 3. Return 200 OK ← ทันที!

  res.status(200).send("OK");
});

// Worker process แยกต่างหาก
workerProcess.on("message", async (msg) => {
  // 4. Parse message ← ช้าก็ได้
  // 5. Save to database
  // 6. Reply to LINE
});
```

**ประโยชน์:**

- ✅ ตอบ LINE ทันที (< 100ms)
- ✅ ไม่มี timeout
- ✅ Retry ได้ถ้าผิดพลาด
- ✅ Scale workers แยกจาก web server

#### 2.2 เลือก Message Queue

**ตัวเลือก:**

| Queue        | Pros                       | Cons                 | เหมาะกับ    |
| ------------ | -------------------------- | -------------------- | ----------- |
| **Redis**    | ง่าย, เร็ว, มี library ดี  | พื้นฐาน, no ack/nack | เริ่มต้น    |
| **RabbitMQ** | Feature ครบ, reliable      | ยุ่งยาก              | Production  |
| **Bull**     | Built on Redis, easy setup | ต้องมี Redis         | แนะนำ! ⭐   |
| **AWS SQS**  | Managed, scale auto        | ต้องใช้ AWS          | Cloud-first |

**แนะนำ: Bull Queue**

```bash
npm install bull @types/bull
```

#### 2.3 Implement Bull Queue

**สร้าง Queue:**

```typescript
// src/queues/messageQueue.ts
import Bull from "bull";
import { redis } from "../config/redis";

export const messageQueue = new Bull("message-processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  defaultJobOptions: {
    attempts: 3, // Retry 3 ครั้งถ้าผิดพลาด
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: true,
    removeOnFail: false, // เก็บไว้ debug
  },
});

// Health monitoring
messageQueue.on("error", (error) => {
  console.error("Queue error:", error);
});

messageQueue.on("active", (job) => {
  console.log(`Processing job ${job.id}`);
});
```

**Producer (Webhook Handler):**

```typescript
// src/handlers/webhook.ts
import { messageQueue } from "../queues/messageQueue";

export async function handleWebhook(req: Request, res: Response) {
  try {
    // 1. Verify LINE signature
    verifyLineSignature(req);

    // 2. เพิ่ม job เข้า queue ← เร็วมาก
    const events = req.body.events;
    for (const event of events) {
      await messageQueue.add("process-message", {
        event,
        timestamp: Date.now(),
      });
    }

    // 3. Return 200 ทันที
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Internal Server Error");
  }
}
```

**Consumer (Worker):**

```typescript
// src/workers/messageWorker.ts
import { messageQueue } from "../queues/messageQueue";
import { processMessage } from "../handlers/message";

// Process jobs
messageQueue.process("process-message", async (job) => {
  const { event } = job.data;

  try {
    // ประมวลผล message (AI parsing, save DB, reply)
    await processMessage(event);

    return { status: "success" };
  } catch (error) {
    console.error("Worker error:", error);
    throw error; // จะ retry อัตโนมัติ
  }
});

console.log("🚀 Message worker started");
```

**รัน Worker แยกต่างหาก:**

```json
// package.json
{
  "scripts": {
    "start": "node dist/index.js",
    "worker": "node dist/workers/messageWorker.js",
    "dev:worker": "ts-node src/workers/messageWorker.ts"
  }
}
```

**Deploy:**

```bash
# Terminal 1: Web server
npm start

# Terminal 2: Worker
npm run worker
```

#### 2.4 Queue Monitoring Dashboard

```typescript
// src/routes/admin.ts
import { messageQueue } from "../queues/messageQueue";

app.get("/admin/queue/stats", async (req, res) => {
  const stats = {
    waiting: await messageQueue.getWaitingCount(),
    active: await messageQueue.getActiveCount(),
    completed: await messageQueue.getCompletedCount(),
    failed: await messageQueue.getFailedCount(),
  };

  res.json(stats);
});
```

**หรือใช้ Bull Board (UI Dashboard):**

```bash
npm install @bull-board/express
```

```typescript
// src/routes/admin.ts
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullAdapter(messageQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());
```

**เข้าดู:** `http://localhost:3000/admin/queues`

---

### Phase 3: Horizontal Scaling (3-4 สัปดาห์)

**เป้าหมาย:** รองรับ 700-1,500+ concurrent users

#### 3.1 Stateless Architecture

**ปัญหาของ Stateful:**

```typescript
// ❌ Bad: In-memory state
const pendingExpenses = new Map<string, PendingExpense>();

// ถ้ามี 3 servers → user อาจได้ server คนละตัว
// Server A เก็บ state → Server B ไม่เห็น
```

**แก้ไข: ใช้ Redis แทน:**

```typescript
// ✅ Good: Redis-backed state
import { redis } from "../config/redis";

export async function storePendingExpense(
  userId: string,
  data: PendingExpense
) {
  const key = `pending:${userId}`;
  await redis.setex(key, 300, JSON.stringify(data)); // 5 minutes TTL
}

export async function getPendingExpense(
  userId: string
): Promise<PendingExpense | null> {
  const key = `pending:${userId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}
```

#### 3.2 Load Balancer Setup

**Docker Compose with Multiple Instances:**

```yaml
# docker-compose.yml
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2
      - app3

  app1:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis

  app2:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis

  app3:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis

  worker1:
    build: .
    command: npm run worker
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis

  worker2:
    build: .
    command: npm run worker
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: expense_bot
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Nginx Load Balancer:**

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        least_conn;  # Load balancing algorithm
        server app1:3000;
        server app2:3000;
        server app3:3000;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

**Deploy:**

```bash
docker-compose up -d --scale app=3 --scale worker=2
```

**ผลลัพธ์:**

- ✅ 3 app instances รับ load ร่วมกัน
- ✅ 2 workers ประมวลผล messages
- ✅ ถ้า 1 instance ล่ม → ยังมีอีก 2 ตัวทำงานต่อ

---

### Phase 4: Database Scaling (4-6 สัปดาห์)

#### 4.1 Connection Pooling with PgBouncer

**ทำไมต้องใช้:**

- PostgreSQL รองรับ connections จำกัด (~100-200)
- แต่ละ app instance ใช้ 20 connections
- 3 instances × 20 = 60 connections → ใช้ไปครึ่งแล้ว
- Workers ใช้อีก 40 connections → เกือบเต็ม!

**PgBouncer = Connection Pooler**

```yaml
# docker-compose.yml
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/expense_bot
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
    ports:
      - "6432:6432"
    depends_on:
      - db
```

**Update Connection String:**

```bash
# .env
# Before: โยงตรงไป PostgreSQL
DATABASE_URL="postgresql://user:pass@db:5432/expense_bot"

# After: โยงผ่าน PgBouncer
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/expense_bot"
```

**ประโยชน์:**

- ✅ รองรับ connections เยอะขึ้น (1,000+)
- ✅ Connection reuse → เร็วขึ้น
- ✅ ลด overhead ของ database

#### 4.2 Read Replicas

**สำหรับ queries ที่อ่านอย่างเดียว:**

```yaml
# docker-compose.yml
services:
  db-primary:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: expense_bot

  db-replica:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: expense_bot
      POSTGRES_MASTER_SERVICE_HOST: db-primary
    command: # Setup streaming replication
```

**Split Read/Write:**

```typescript
// src/config/database.ts
import { PrismaClient } from "@prisma/client";

// Primary: Write operations
export const prismaWrite = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_PRIMARY_URL,
    },
  },
});

// Replica: Read operations
export const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL,
    },
  },
});

// Helper functions
export async function findExpenses(userId: string) {
  // ✅ Read from replica
  return prismaRead.expense.findMany({ where: { userId } });
}

export async function createExpense(data: any) {
  // ✅ Write to primary
  return prismaWrite.expense.create({ data });
}
```

#### 4.3 Database Sharding (Advanced)

**เมื่อไหร่ต้องใช้:** มี users > 10,000 คน หรือข้อมูล > 100GB

**แนวคิด:** แบ่ง users ออกเป็นหลาย databases

```typescript
// Shard by userId
function getShardDatabase(userId: string) {
  const shardNumber = hashUserId(userId) % 4; // 4 shards

  switch (shardNumber) {
    case 0:
      return prismaRead1;
    case 1:
      return prismaRead2;
    case 2:
      return prismaRead3;
    case 3:
      return prismaRead4;
  }
}

// Usage
const db = getShardDatabase(userId);
const expenses = await db.expense.findMany({ where: { userId } });
```

**ข้อควรระวัง:**

- ❌ ซับซ้อนมาก
- ❌ Cross-shard queries ยาก
- ❌ Maintenance ยุ่งยาก
- ✅ ใช้เฉพาะเมื่อจำเป็นจริงๆ

---

### Phase 5: Advanced Caching (2-3 สัปดาห์)

#### 5.1 Multi-Layer Caching

```
Request
  ↓
L1: Application Cache (in-memory, 10s TTL)
  ↓ (cache miss)
L2: Redis Cache (1 hour TTL)
  ↓ (cache miss)
L3: Database
```

**Implementation:**

```typescript
// src/services/multiLayerCache.ts
import NodeCache from "node-cache";
import { redis } from "../config/redis";
import { prisma } from "../config/database";

// L1: In-memory cache (แต่ละ instance มีของตัวเอง)
const memoryCache = new NodeCache({
  stdTTL: 10, // 10 seconds
  checkperiod: 5,
});

export async function getCachedExpenseSummary(userId: string, month: string) {
  const cacheKey = `summary:${userId}:${month}`;

  // L1: Check memory cache
  const l1 = memoryCache.get(cacheKey);
  if (l1) {
    console.log("✅ L1 Cache HIT");
    return l1;
  }

  // L2: Check Redis cache
  const l2 = await redis.get(cacheKey);
  if (l2) {
    console.log("✅ L2 Cache HIT");
    const data = JSON.parse(l2);
    memoryCache.set(cacheKey, data); // Store in L1
    return data;
  }

  // L3: Query database
  console.log("❌ Cache MISS - Query DB");
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(`${month}-01`),
        lt: new Date(`${month}-31`),
      },
    },
  });

  const summary = calculateSummary(expenses);

  // Store in L2 (Redis)
  await redis.setex(cacheKey, 3600, JSON.stringify(summary));

  // Store in L1 (Memory)
  memoryCache.set(cacheKey, summary);

  return summary;
}
```

#### 5.2 Cache Invalidation

**ปัญหา:** ข้อมูลใน cache อาจเก่า

**วิธีแก้:**

```typescript
// src/services/expense.ts
export async function createExpense(userId: string, data: any) {
  // 1. Create expense
  const expense = await prisma.expense.create({ data });

  // 2. Invalidate caches
  const month = format(expense.date, "yyyy-MM");
  await redis.del(`summary:${userId}:${month}`);
  memoryCache.del(`summary:${userId}:${month}`);

  return expense;
}
```

**Pattern: Write-Through Cache**

```typescript
// Update cache ทันทีเมื่อมีการเปลี่ยนแปลง
export async function updateExpense(expenseId: string, data: any) {
  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data,
  });

  // Recalculate และ update cache
  const summary = await calculateUserSummary(expense.userId);
  await redis.setex(
    `summary:${expense.userId}:${month}`,
    3600,
    JSON.stringify(summary)
  );

  return expense;
}
```

---

## 🤖 AI Service Optimization

### ปัญหา: AI API Rate Limiting

```
Google Gemini Limits:
- Free: 60 requests/minute
- Paid: 1,000 requests/minute

Peak load: 840 requests/minute
→ ใกล้เต็ม!
```

### วิธีแก้:

#### 1. Request Batching

```typescript
// รวม messages หลายๆ ข้อความ process พร้อมกัน
import pLimit from "p-limit";

const aiLimit = pLimit(50); // จำกัด 50 concurrent AI requests

export async function processMessageBatch(messages: Message[]) {
  const promises = messages.map((msg) =>
    aiLimit(() => parseExpenseWithAI(msg.text))
  );

  const results = await Promise.allSettled(promises);
  return results;
}
```

#### 2. Intelligent Fallback

```typescript
export async function parseExpense(text: string) {
  try {
    // 1. ลองใช้ AI ก่อน
    return await parseWithAI(text);
  } catch (error) {
    if (error.code === 429) {
      // 2. ถ้า rate limit → ใช้ fallback parser
      console.warn("AI rate limited, using fallback");
      return parseFallback(text);
    }
    throw error;
  }
}
```

#### 3. Cache AI Results

```typescript
// Cache ผลลัพธ์ของ AI สำหรับข้อความที่เหมือนกัน
export async function parseExpenseWithCache(text: string) {
  const cacheKey = `ai:${md5(text)}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Call AI
  const result = await parseWithAI(text);

  // Cache result (7 days)
  await redis.setex(cacheKey, 604800, JSON.stringify(result));

  return result;
}
```

#### 4. Multi-Provider Support

```typescript
// src/services/ai/factory.ts
export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "google";

  switch (provider) {
    case "google":
      return new GoogleAIProvider();
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// Auto-failover
export async function parseWithFailover(text: string) {
  const providers = ["google", "openai", "anthropic"];

  for (const provider of providers) {
    try {
      const ai = createAIProvider(provider);
      return await ai.parse(text);
    } catch (error) {
      console.warn(`${provider} failed, trying next...`);
      continue;
    }
  }

  // All failed → use regex fallback
  return parseFallback(text);
}
```

---

## 📊 Monitoring & Alerting

### ต้อง Monitor อะไรบ้าง?

#### 1. Application Metrics

```typescript
// src/utils/metrics.ts
import promClient from "prom-client";

// สร้าง metrics
export const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

export const messageProcessed = new promClient.Counter({
  name: "messages_processed_total",
  help: "Total number of messages processed",
  labelNames: ["status"], // success, failed
});

export const queueSize = new promClient.Gauge({
  name: "queue_size",
  help: "Number of jobs in queue",
  labelNames: ["queue_name"],
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || "unknown", res.statusCode)
      .observe(duration);
  });
  next();
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.send(await promClient.register.metrics());
});
```

#### 2. Database Monitoring

```typescript
// src/utils/dbMonitoring.ts
import { prisma } from "../config/database";

setInterval(async () => {
  const metrics = await prisma.$metrics.json();

  console.log("Database Metrics:", {
    activeConnections: metrics.connections.active,
    idleConnections: metrics.connections.idle,
    totalQueries: metrics.queries.total,
    avgQueryTime: metrics.queries.avgDuration,
  });
}, 60000); // Every minute
```

#### 3. Queue Monitoring

```typescript
// src/utils/queueMonitoring.ts
import { messageQueue } from "../queues/messageQueue";
import { queueSize } from "./metrics";

setInterval(async () => {
  const waiting = await messageQueue.getWaitingCount();
  const active = await messageQueue.getActiveCount();
  const failed = await messageQueue.getFailedCount();

  queueSize.labels("waiting").set(waiting);
  queueSize.labels("active").set(active);
  queueSize.labels("failed").set(failed);

  if (waiting > 100) {
    console.warn(`⚠️ High queue size: ${waiting}`);
  }
}, 10000); // Every 10 seconds
```

#### 4. Alerting with Slack/Email

```typescript
// src/utils/alerting.ts
import axios from "axios";

export async function sendSlackAlert(message: string) {
  await axios.post(process.env.SLACK_WEBHOOK_URL!, {
    text: `🚨 ALERT: ${message}`,
  });
}

// Monitor error rate
let errorCount = 0;
const ERROR_THRESHOLD = 50; // 50 errors in 5 minutes

setInterval(
  () => {
    if (errorCount > ERROR_THRESHOLD) {
      sendSlackAlert(`High error rate: ${errorCount} errors in 5 minutes`);
    }
    errorCount = 0; // Reset
  },
  5 * 60 * 1000
);

// Log errors
process.on("uncaughtException", (error) => {
  errorCount++;
  console.error("Uncaught exception:", error);
  sendSlackAlert(`Uncaught exception: ${error.message}`);
});
```

### Monitoring Stack

**แนะนำ:**

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
```

**Grafana Dashboards:**

- HTTP Request Rate & Duration
- Database Queries Per Second
- Queue Size & Processing Time
- Memory & CPU Usage
- Error Rate

---

## 💰 Cost Optimization

### การคำนวณต้นทุน

#### Scenario: 1,000 Users

```
Assumptions:
- 1,000 active users
- 5 messages/user/day = 5,000 messages/day
- 150,000 messages/month

Resources Needed:
1. App Servers: 3 instances (2 vCPU, 4GB RAM each)
2. Workers: 2 instances (2 vCPU, 4GB RAM each)
3. Database: 1 instance (4 vCPU, 16GB RAM)
4. Redis: 1 instance (2GB RAM)
5. Load Balancer: 1
```

#### Cloud Cost Estimate (AWS)

```
Monthly Costs:
├─ EC2 Instances (5× t3.medium)     : $150
├─ RDS PostgreSQL (db.t3.large)     : $120
├─ ElastiCache Redis (cache.t3.small): $30
├─ Application Load Balancer        : $25
├─ Data Transfer (100GB)            : $10
├─ Google Gemini API (150K requests): $50
└─ Monitoring (CloudWatch/Grafana)  : $15
                                     ─────
Total                               : $400/month
```

#### Cost Per User

```
$400 / 1,000 users = $0.40/user/month
```

### วิธีลดต้นทุน

#### 1. ใช้ Spot Instances

```yaml
# สำหรับ workers (สามารถ interrupt ได้)
# ประหยัด ~70%
workers:
  - type: spot
    instance_type: t3.medium
    savings: 70%
```

#### 2. Auto Scaling

```typescript
// Scale down ตอนไม่มี user
// เช่น กลางคืน 00:00-06:00 → ใช้ 1 instance
// เช้า-เย็น 08:00-20:00 → ใช้ 3 instances

// AWS Auto Scaling Policy
const scalingPolicy = {
  scaleUp: {
    when: "cpu > 70% for 5 minutes",
    add: 1,
  },
  scaleDown: {
    when: "cpu < 30% for 10 minutes",
    remove: 1,
  },
};
```

#### 3. Database Optimization

```sql
-- ลบข้อมูลเก่าที่ไม่ใช้แล้ว
DELETE FROM "Expense"
WHERE "date" < NOW() - INTERVAL '2 years';

-- Archive แทนการลบ
-- ย้ายไป S3 หรือ cheaper storage
```

#### 4. Caching มากขึ้น

```typescript
// ยิ่ง cache hit rate สูง → database queries น้อย
// → ใช้ database ขนาดเล็กลง → ถูกลง

// เป้าหมาย: Cache hit rate > 80%
```

---

## 🚢 Migration Plan

### แผนการ Migrate จาก Single Server → Scaled Architecture

#### Phase 1: Preparation (Week 1)

**Day 1-2:**

- [ ] Setup staging environment
- [ ] Deploy current version to staging
- [ ] Run load tests
- [ ] Document baseline performance

**Day 3-4:**

- [ ] Add database indexes
- [ ] Setup Redis
- [ ] Implement basic caching
- [ ] Test on staging

**Day 5-7:**

- [ ] Deploy Phase 1 to production (off-peak hours)
- [ ] Monitor for issues
- [ ] Rollback plan ready

#### Phase 2: Message Queue (Week 2-3)

**Week 2:**

- [ ] Setup Bull Queue on staging
- [ ] Implement producers & consumers
- [ ] Test queue functionality
- [ ] Test retry mechanisms
- [ ] Load test queue system

**Week 3:**

- [ ] Deploy queue to production
- [ ] Monitor queue size & processing time
- [ ] Adjust worker count based on load

#### Phase 3: Horizontal Scaling (Week 4-5)

**Week 4:**

- [ ] Setup Docker Compose with multiple instances
- [ ] Configure Nginx load balancer
- [ ] Migrate to stateless architecture (Redis)
- [ ] Test on staging

**Week 5:**

- [ ] Deploy to production gradually (Blue-Green)
- [ ] Monitor all instances
- [ ] Adjust instance count

#### Phase 4: Advanced Features (Week 6+)

- [ ] Setup PgBouncer
- [ ] Configure read replicas
- [ ] Implement multi-layer caching
- [ ] Setup monitoring stack (Prometheus + Grafana)
- [ ] Setup alerting

### Rollback Plan

```bash
# ถ้าเกิดปัญหา → rollback ได้ทันที

# 1. Keep old version running
docker tag app:v1.0 app:v1.0-backup

# 2. Deploy new version
docker tag app:v2.0 app:latest

# 3. ถ้ามีปัญหา → switch กลับ
docker tag app:v1.0-backup app:latest
docker-compose up -d --force-recreate

# 4. DNS/Load Balancer → point back to old version
```

---

## 📝 Checklist สำหรับ Production

### Before Going Live

**Infrastructure:**

- [ ] Load balancer configured
- [ ] Multiple app instances running
- [ ] Workers running separately
- [ ] Database with connection pooling
- [ ] Redis for caching & sessions
- [ ] Backup strategy in place

**Code:**

- [ ] All database queries have indexes
- [ ] Caching implemented
- [ ] Message queue working
- [ ] Stateless architecture (no in-memory state)
- [ ] Error handling & retry logic
- [ ] Rate limiting
- [ ] Logging configured

**Monitoring:**

- [ ] Application metrics exposed
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards created
- [ ] Alerts configured (Slack/Email)
- [ ] Log aggregation (ELK/Loki)
- [ ] Uptime monitoring

**Testing:**

- [ ] Load tests passed (1,500 req/min)
- [ ] Stress tests passed (3,000 req/min)
- [ ] Failover tests (kill instances)
- [ ] Database failure simulation
- [ ] Redis failure simulation

**Documentation:**

- [ ] Architecture diagram updated
- [ ] Runbook for incidents
- [ ] Deployment guide
- [ ] Monitoring guide
- [ ] Rollback procedures

---

## 🎓 สรุปสำหรับ Junior

### Core Concepts

**1. Vertical Scaling vs Horizontal Scaling**

```
Vertical (Scale Up):
- เพิ่ม CPU/RAM ของ server เดิม
- ง่าย แต่มีขีดจำกัด
- แพง

Horizontal (Scale Out):
- เพิ่ม server มากขึ้น
- ซับซ้อน แต่ scale ได้ไม่จำกัด
- ถูกกว่า (ในระยะยาว)
```

**2. Caching Strategy**

```
ไม่มี Cache: ทุก request → Database (ช้า)
มี Cache: ส่วนใหญ่ → Cache (เร็ว), บางทีถึง Database
```

**3. Asynchronous Processing**

```
Sync: รอทำเสร็จก่อนตอบ (ช้า, ติด timeout)
Async: ตอบทันที, ทำทีหลัง (เร็ว, ไม่ติด timeout)
```

**4. Stateless Architecture**

```
Stateful: เก็บข้อมูลใน server (แต่ละ server ต่างกัน)
Stateless: เก็บข้อมูลใน Redis (ทุก server เห็นเหมือนกัน)
```

### การเรียนรู้ต่อ

**หนังสือแนะนำ:**

- Designing Data-Intensive Applications (Martin Kleppmann)
- Site Reliability Engineering (Google)
- High Performance Browser Networking

**Online Courses:**

- System Design Interview (ByteByteGo)
- Microservices Architecture (Udemy)
- AWS Solutions Architect

**Practice:**

- ทำ load testing กับ k6 หรือ Artillery
- Deploy บน AWS/GCP/Azure
- Monitor ด้วย Grafana
- เรียนรู้ Docker & Kubernetes

---

## 🎯 เป้าหมายสุดท้าย

**Performance:**

- ✅ Response time < 2 วินาที (p95)
- ✅ รองรับ 1,500 concurrent users
- ✅ Process 100+ messages/second

**Reliability:**

- ✅ Uptime 99.9% (downtime < 9 ชม./ปี)
- ✅ Zero message loss
- ✅ Auto-recovery จาก failures

**Cost:**

- ✅ < $0.50 per user per month
- ✅ Auto-scaling ตาม load
- ✅ Optimize AI API usage

---

**สร้างด้วย ❤️ เพื่อ Junior Developers ที่กำลังเรียนรู้ระบบ Scale**

📖 See also: [Architecture](./ARCHITECTURE.md) | [Deployment Guide](./deploy-production.md) | [Monitoring Guide](./MONITORING.md)
