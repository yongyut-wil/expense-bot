# 💰 Expense Bot

LINE Bot สำหรับบันทึกรายรับ-รายจ่าย ด้วย AI ที่ช่วยแปลงข้อความธรรมดาให้เป็นรายการบัญชีอัตโนมัติ

## ✨ Features

- 🤖 **AI-Powered Parsing** - ใช้ Google Gemini แปลงข้อความธรรมดาเป็นรายการรับ-จ่าย พร้อม prompt ที่ปรับปรุงใหม่
- ✅ **Confirmation Flow** - ยืนยันก่อนบันทึก ทั้งข้อความพิมพ์และสลิปภาพ ป้องกันการบันทึกผิดพลาด
- 🎨 **Modern UI** - Flex Message ดีไซน์ใหม่สวยงาม มี badges, ยอดเงินขนาดใหญ่, และ layout ที่ทันสมัย
- � **OCR Support** - อ่านสลิปภาพอัตโนมัติด้วย Google Gemini Vision พร้อมแสดงความแม่นยำ
- �💬 **LINE Integration** - รับ-ส่งข้อความผ่าน LINE Bot พร้อม Rich Messages
- 📊 **สรุปรายเดือน** - ดูสรุปรายรับ-รายจ่ายแยกตามหมวดหมู่
- 🏷️ **จัดหมวดหมู่อัตโนมัติ** - AI จัดหมวดหมู่รายการให้อัตโนมัติ รองรับการศึกษา, อาหาร, เดินทาง และอื่นๆ
- 🔒 **Secure** - มี signature verification, rate limiting, และ security headers
- 📈 **Database** - เก็บข้อมูลใน PostgreSQL ด้วย Prisma ORM
- 🎯 **Fallback Parser** - มี regex parser สำรองเมื่อ AI ไม่ทำงาน
- ⏱️ **Pending System** - ระบบรอยืนยัน 5 นาที พร้อมป้องกันการกดซ้ำ
- 🐳 **Docker Support** - รันง่ายด้วย Docker และ Docker Compose

## 🛠️ Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **AI Provider**: Google Gemini API
- **Messaging**: LINE Messaging API
- **Security**: Helmet, Express Rate Limit
- **Logging**: Winston
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- LINE Developers Account
- Google AI API Key
- Docker & Docker Compose (สำหรับ container environment)

## 🚀 Quick Start

### แบบปกติ (Local Development)

```bash
# 1. Clone repository
git clone <repository-url>
cd expense-bot

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# แก้ไขไฟล์ .env ตามค่าจริง

# 4. Setup database
npm run prisma:migrate

# 5. Run development server
npm run dev
```

### แบบ Docker (แนะนำสำหรับ Production)

```bash
# 1. Clone repository
git clone <repository-url>
cd expense-bot

# 2. สร้างและรัน PostgreSQL container
docker run --name expense-bot-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=expensebot \
  -p 5432:5432 \
  -d postgres:16

# 3. Build และรัน app container
docker build -t expense-bot .
docker run --name expense-bot-app \
  --link expense-bot-db:db \
  -e DATABASE_URL=postgresql://postgres:password@db:5432/expensebot \
  -e LINE_CHANNEL_SECRET=your_secret \
  -e LINE_CHANNEL_ACCESS_TOKEN=your_token \
  -e GOOGLE_API_KEY=your_api_key \
  -p 3000:3000 \
  expense-bot
```

### แบบ Docker Compose (ง่ายที่สุด)

```bash
# 1. Clone repository
git clone <repository-url>
cd expense-bot

# 2. Copy และแก้ไข environment file
cp .env.example .env
# แก้ไขไฟล์ .env ตามค่าจริง

# 3. รันทุกอย่างด้วยคำสั่งเดียว
docker-compose up -d

# 4. Run database migrations
docker-compose exec app npm run prisma:migrate

# 5. Check logs
docker-compose logs -f
```

## 📖 Documentation

- [📚 Setup Guide](./docs/SETUP_GUIDE.md) - คู่มือการติดตั้งแบบละเอียด
- [🏗️ Architecture](./docs/ARCHITECTURE.md) - อธิบายสถาปัตยกรรมระบบ
- [🎓 Workshop Guide](./docs/WORKSHOP.md) - คู่มือสอนแบบ hands-on
- [🐳 Docker Guide](./docs/DOCKER.md) - คู่มือการใช้งาน Docker
- [🧪 Testing Guide](./docs/TESTING_GUIDE.md) - คู่มือการเขียน Tests
- [📊 Test Coverage Report](./docs/TEST_COVERAGE.md) - รายงาน Test Coverage

## 💬 การใช้งาน

### บันทึกรายจ่าย

```text
กินข้าว 120
ค่ารถ BTS 44 บาท
ช้อปปิ้ง 500
```

### บันทึกรายรับ

```text
รับเงินเดือน 30000
ได้โบนัส 5000 บาท
```

### คำสั่งพิเศษ

- `สรุป` - ดูสรุปรายรับ-รายจ่ายเดือนนี้
- `ล่าสุด` - ดู 5 รายการล่าสุด
- `วิธีใช้` - ดูคำแนะนำการใช้งาน

## 📁 โครงสร้างโปรเจ็ค

```
expense-bot/
├── src/
│   ├── app.ts              # Express app setup
│   ├── index.ts            # Entry point
│   ├── config/             # Configuration & env validation
│   ├── db/                 # Database connection
│   ├── handlers/           # Request handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   │   ├── ai/            # AI prompt & types
│   │   ├── google.ts      # Google Gemini provider
│   │   ├── fallback.ts    # Regex fallback parser
│   │   ├── expense.ts     # Expense operations
│   │   └── line.ts        # LINE messaging
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities (logger, errors)
├── prisma/
│   └── schema.prisma      # Database schema
├── docs/                  # Documentation
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
└── .env.example           # Environment variables template
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in Docker
docker-compose exec app npm test
```

## 🔧 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm test                 # Run tests
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio

# Docker commands
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

## 🔐 Environment Variables

```env
# LINE Bot
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

# AI Provider
AI_PROVIDER=google
GOOGLE_API_KEY=

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/expensebot

# App Configuration
PORT=3000
NODE_ENV=development
```

## 🏗️ Architecture Highlights

- **Factory Pattern** - AI provider สามารถเปลี่ยนได้ง่าย (Google, OpenAI, Anthropic)
- **Error Handling** - Custom error classes และ global error handler
- **Security Layers** - Signature verification, rate limiting, helmet
- **Graceful Shutdown** - รอ connections ปิดก่อน terminate
- **Structured Logging** - Winston logger พร้อม metadata
- **Database Abstraction** - Prisma ORM + type-safe queries
- **Container Ready** - Dockerfile และ docker-compose สำหรับ production

## � License

MIT License - see [LICENSE](./LICENSE) file for details.

```text
Copyright (c) 2026 Expense Bot Contributors
```

---

Built with ❤️ for expense tracking enthusiasts

---

📚 อ่านเพิ่มเติมใน [Setup Guide](./docs/SETUP_GUIDE.md), [Architecture Documentation](./docs/ARCHITECTURE.md) และ [Docker Guide](./docs/DOCKER.md)
