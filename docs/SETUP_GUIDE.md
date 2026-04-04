# 📚 Setup Guide - คู่มือการติดตั้งแบบละเอียด

คู่มือนี้จะพาคุณติดตั้งและรัน Expense Bot ตั้งแต่ต้นจนจบ เหมาะสำหรับผู้ที่เพิ่งเริ่มต้น

---

## 📋 สิ่งที่ต้องเตรียม

### 1. ติดตั้ง Software ที่จำเป็น

#### 1.1 Node.js (เวอร์ชั่น 18 ขึ้นไป)

**macOS:**

```bash
# ติดตั้งผ่าน Homebrew
brew install node

# ตรวจสอบเวอร์ชั่น
node --version  # ควรได้ v18.x.x หรือสูงกว่า
npm --version
```

**Windows:**

1. ดาวน์โหลดจาก https://nodejs.org/
2. เลือก LTS version
3. ติดตั้งตามขั้นตอน
4. เปิด Command Prompt และรัน `node --version`

**Linux (Ubuntu/Debian):**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

#### 1.2 PostgreSQL (เวอร์ชั่น 14 ขึ้นไป)

**macOS:**

```bash
# ติดตั้งผ่าน Homebrew
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# เข้า PostgreSQL shell
psql postgres
```

**Windows:**

1. ดาวน์โหลดจาก https://www.postgresql.org/download/windows/
2. ติดตั้ง PostgreSQL พร้อม pgAdmin
3. จดรหัผ่าน postgres user ที่ตั้งไว้

**Linux:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 1.3 Git

```bash
# macOS
brew install git

# Windows - ดาวน์โหลดจาก
# https://git-scm.com/download/win

# Linux
sudo apt install git
```

---

## 🗄️ ตั้งค่า Database

### 1. สร้าง Database

```bash
# เข้า PostgreSQL shell
psql postgres

# สร้าง database ชื่อ expensebot
CREATE DATABASE expensebot;

# สร้าง user (optional - ถ้าต้องการ)
CREATE USER expensebot_user WITH PASSWORD 'your_password';

# ให้สิทธิ์
GRANT ALL PRIVILEGES ON DATABASE expensebot TO expensebot_user;

# ออกจาก psql
\q
```

### 2. ทดสอบการเชื่อมต่อ

```bash
# ลองเชื่อมต่อ database ที่สร้าง
psql -d expensebot

# ถ้าเข้าได้แสดงว่าสำเร็จ
# พิมพ์ \q เพื่อออก
```

---

## 🔑 ตั้งค่า LINE Bot

### 1. สร้าง LINE Developers Account

1. ไปที่ https://developers.line.biz/
2. Login ด้วย LINE account
3. สร้าง Provider (ชื่ออะไรก็ได้ เช่น "My Company")

### 2. สร้าง Channel

1. คลิก "Create a new channel"
2. เลือก "Messaging API"
3. กรอกข้อมูล:
   - **Channel name**: Expense Bot (หรือชื่ออื่นที่ชอบ)
   - **Channel description**: Bot for tracking expenses
   - **Category**: Finance
   - **Subcategory**: Personal Finance
4. กด Create

### 3. ตั้งค่า Channel

1. ไปที่ Tab "Messaging API"
2. Scroll ลงไปหา **Channel access token**
   - คลิก "Issue" เพื่อสร้าง token
   - **คัดลอก token นี้ไว้** (จะใช้ใน `.env`)
3. Scroll ขึ้นไปหา **Channel secret**
   - **คัดลอก secret นี้ไว้** (จะใช้ใน `.env`)
4. ตั้งค่า Webhook:
   - เปิด "Use webhook" = enabled
   - ปิด "Auto-reply messages" = disabled
   - ปิด "Greeting messages" = disabled

### 4. เพิ่มเพื่อนใน LINE

1. ไปที่ Tab "Messaging API"
2. Scroll ลงหา **QR Code**
3. Scan QR Code ด้วยมือถือเพื่อเพิ่มเพื่อน bot
4. **อย่าทดสอบส่งข้อความตอนนี้** (ระบบยังไม่พร้อม)

---

## 🤖 ตั้งค่า Google Gemini API

### 1. สร้าง API Key

1. ไปที่ https://aistudio.google.com/app/apikey
2. Login ด้วย Google Account
3. คลิก "Get API Key" หรือ "Create API Key"
4. เลือก "Create API key in new project"
5. **คัดลอก API Key** (จะใช้ใน `.env`)

### 2. ทดสอบ API Key (Optional)

```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"

# ถ้าได้ response เป็น JSON ของ models แสดงว่า key ใช้งานได้
```

---

## 💻 ติดตั้งโปรเจ็ค

### 1. Clone Repository

```bash
cd ~/Projects  # หรือ folder ที่ต้องการ
git clone <repository-url>
cd expense-bot
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

คำสั่งนี้จะติดตั้ง packages ทั้งหมดที่อยู่ใน `package.json` รวมถึง:

- Express, LINE SDK, Google AI SDK
- Prisma ORM
- TypeScript และ ts-node
- Jest สำหรับ testing
- และอื่นๆ

### 3. ตั้งค่า Environment Variables

```bash
# คัดลอกไฟล์ template
cp .env.example .env

# แก้ไขไฟล์ .env
nano .env  # หรือใช้ editor ที่ชอบ
```

**แก้ไขค่าต่อไปนี้ใน `.env`:**

```env
# LINE Bot (ได้จากขั้นตอนก่อนหน้า)
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here

# AI Provider
AI_PROVIDER=google
GOOGLE_API_KEY=your_google_api_key_here

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/expensebot
# แก้ password เป็นรหัสผ่านของ postgres user

# App Configuration
PORT=3000
NODE_ENV=development
```

**ตัวอย่างที่กรอกจริง:**

```env
LINE_CHANNEL_SECRET=abcd1234567890xyz
LINE_CHANNEL_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_API_KEY=AIzaSyB1234567890abcdefghij
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/expensebot
PORT=3000
NODE_ENV=development
```

### 4. Setup Database Schema

```bash
# Generate Prisma Client และรัน migrations
npm run prisma:migrate

# ระบบจะถาม "Enter a name for the new migration"
# พิมพ์: init (หรืออะไรก็ได้)
```

คำสั่งนี้จะ:

- สร้างตาราง `User`, `Expense`, `Category` ใน database
- Generate Prisma Client ไว้ที่ `src/generated/prisma`

### 6. ตรวจสอบ Database (Optional)

```bash
# เปิด Prisma Studio - GUI สำหรับดู database
npm run prisma:studio

# เปิดเบราว์เซอร์ไปที่ http://localhost:5555
# จะเห็นตารางทั้ง 3 แบบว่างๆ
```

---

## 🚀 รันโปรเจ็ค

### 1. Start Development Server

```bash
npm run dev
```

ถ้าเห็นข้อความแบบนี้แสดงว่าสำเร็จ:

```
info: Database connected ✅
info: Server running 🚀 {"port":3000,"env":"development"}
```

### 2. ทดสอบ Health Check

เปิด terminal อีกอัน หรือใช้เบราว์เซอร์:

```bash
curl http://localhost:3000/health

# ควรได้ response:
# {"status":"ok","timestamp":"2024-03-23T11:23:45.678Z"}
```

หรือเปิดเบราว์เซอร์ไปที่: `http://localhost:3000/health`

---

## 🌐 ตั้งค่า Webhook (เชื่อม LINE กับ Server)

เพื่อให้ LINE ส่งข้อความมาที่ server เรา จำเป็นต้องมี **public URL**

### วิธีที่ 1: ใช้ ngrok (แนะนำสำหรับ development)

#### 1.1 ติดตั้ง ngrok

```bash
# macOS
brew install ngrok

# Windows/Linux - ดาวน์โหลดจาก
# https://ngrok.com/download
```

#### 1.2 สร้าง Account และ Auth Token

1. ไปที่ https://ngrok.com/ และสมัครฟรี
2. ไปที่ Dashboard > Your Authtoken
3. คัดลอก authtoken

```bash
# ตั้งค่า authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### 1.3 รัน ngrok

```bash
# เปิด terminal ใหม่ (อันเดิมยัง run dev server อยู่)
ngrok http 3000
```

จะได้ผลลัพธ์แบบนี้:

```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

**คัดลอก URL** (https://abc123.ngrok.io) นี้ไว้

#### 1.4 ตั้งค่า Webhook URL ใน LINE

1. กลับไปที่ LINE Developers Console
2. เลือก Channel ที่สร้างไว้
3. ไปที่ Tab "Messaging API"
4. หา "Webhook URL"
5. คลิก "Edit" และใส่: `https://abc123.ngrok.io/webhook`
6. กด "Update"
7. คลิก "Verify" เพื่อทดสอบ
   - ถ้าขึ้น "Success" แสดงว่าเชื่อมต่อสำเร็จ ✅

### วิธีที่ 2: Deploy จริง (Production)

สำหรับ production แนะนำให้ deploy บน:

- **Railway** - https://railway.app
- **Render** - https://render.com
- **Heroku** - https://heroku.com
- **Google Cloud Run**
- **AWS Elastic Beanstalk**

---

## ✅ ทดสอบการทำงาน

### 1. ทดสอบส่งข้อความ

1. เปิด LINE บนมือถือ
2. ไปที่แชทของ bot ที่เพิ่มเพื่อนไว้
3. ส่งข้อความ: **`กินข้าว 120`**

**ถ้าสำเร็จจะได้:**

```
💸 บันทึกรายจ่ายแล้วค่ะ!
📝 กินข้าว
💵 120 บาท
🏷️ อาหาร
```

### 2. ทดสอบคำสั่งอื่นๆ

```
# บันทึกรายจ่าย
ค่ารถ BTS 44

# บันทึกรายรับ
รับเงินเดือน 30000

# ดูสรุป
สรุป

# ดูรายการล่าสุด
ล่าสุด

# ดูวิธีใช้
วิธีใช้
```

### 3. ตรวจสอบ Database

```bash
# เปิด Prisma Studio
npm run prisma:studio

# ไปที่ http://localhost:5555
# คลิก "Expense" จะเห็นรายการที่บันทึก
```

### 4. ดู Logs

ดูใน terminal ที่รัน `npm run dev` จะเห็น logs:

```
info: 🎯 POST /webhook hit {"ip":"::1"}
info: 📥 Webhook received
info: Received message {"userId":"U1234...","text":"กินข้าว 120"}
info: 🤖 Sending to AI {"text":"กินข้าว 120"}
info: ✅ AI response {"parsed":{...}}
info: Expense saved {"userId":"...","amount":120}
```

---

## 🐛 Troubleshooting

### ปัญหา: Database connection failed

**Error:**

```
Error: P1001: Can't reach database server at localhost:5432
```

**วิธีแก้:**

```bash
# 1. ตรวจสอบว่า PostgreSQL running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# 2. Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql  # Linux

# 3. ทดสอบเชื่อมต่อ
psql -d expensebot
```

### ปัญหา: Invalid environment variables

**Error:**

```
❌ Invalid environment variables:
LINE_CHANNEL_SECRET is required
```

**วิธีแก้:**

1. ตรวจสอบว่าไฟล์ `.env` มีอยู่จริง
2. เช็คว่ากรอก environment variables ครบ
3. เช็คว่าไม่มีช่องว่างหน้าหลังค่าที่กรอก
4. Restart server: `Ctrl+C` แล้ว `npm run dev` ใหม่

### ปัญหา: LINE webhook verification failed

**Error ใน LINE Console:**

```
The webhook returned an HTTP status code other than 200
```

**วิธีแก้:**

1. เช็คว่า server running อยู่: `curl http://localhost:3000/health`
2. เช็คว่า ngrok running และใช้ URL ล่าสุด
3. เช็คว่า webhook URL ใน LINE = `https://xxx.ngrok.io/webhook` (ต้องมี `/webhook`)
4. ดู logs ใน terminal ที่รัน server

### ปัญหา: AI parsing ไม่ทำงาน

**Symptom:** ส่งข้อความแล้วได้ "ไม่เข้าใจค่ะ"

**วิธีแก้:**

1. เช็ค `GOOGLE_API_KEY` ใน `.env` ว่าถูกต้อง
2. ทดสอบ API key:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY"
   ```
3. ดู error logs ใน terminal
4. ถ้า AI fail ระบบจะใช้ fallback parser แทน (regex-based)

### ปัญหา: Port 3000 ถูกใช้แล้ว

**Error:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**วิธีแก้:**

```bash
# หา process ที่ใช้ port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process นั้น
kill -9 <PID>  # macOS/Linux

# หรือเปลี่ยน port ใน .env
PORT=3001
```

---

## 🧪 การทดสอบ (Testing)

### รัน Tests

```bash
# รัน tests ทั้งหมด
npm test

# รัน tests แบบ watch mode (รันใหม่เมื่อไฟล์เปลี่ยน)
npm run test:watch

# รัน tests พร้อม coverage report
npm run test:coverage
```

### เขียน Tests เพิ่ม

Tests อยู่ที่ `src/__tests__/` โครงสร้าง:

```
src/__tests__/
├── handlers/
│   └── message.test.ts
├── services/
│   ├── expense.test.ts
│   └── fallback.test.ts
└── __mocks__/         # Mock data
```

---

## 🚀 Build สำหรับ Production

### 1. Build TypeScript เป็น JavaScript

```bash
npm run build
```

Output จะอยู่ที่ `dist/` folder

### 2. รัน Production Server

```bash
# ตั้งค่า environment
export NODE_ENV=production

# รัน server
npm start
```

### 3. ตั้งค่า Production Database

```bash
# ใช้ DATABASE_URL ของ production
export DATABASE_URL="postgresql://user:pass@prod-host:5432/db"

# รัน migrations
npx prisma migrate deploy
```

---

## 📊 Monitoring & Debugging

### ดู Logs

Logs จะแสดงผ่าน Winston logger:

- **Development**: แสดงทุกอย่างรวม debug logs
- **Production**: แสดงแค่ info, warn, error

### Database Management

```bash
# เปิด Prisma Studio
npm run prisma:studio

# Reset database (ลบข้อมูลทั้งหมด)
npx prisma migrate reset

# Format schema file
npx prisma format
```

---

## 🎓 ขั้นตอนถัดไป

1. ✅ Setup เสร็จแล้ว
2. 📖 อ่าน [Architecture Documentation](./ARCHITECTURE.md) เพื่อเข้าใจระบบ
3. 🎯 ทำ [Workshop Guide](./WORKSHOP.md) เพื่อเรียนรู้ลึกขึ้น
4. 🔧 ปรับแต่งระบบตามความต้องการ
5. 🚀 Deploy production

---

## ❓ คำถามที่พบบ่อย (FAQ)

### Q: ต้องเสียเงินไหม?

A: ไม่ต้อง!

- LINE Messaging API ฟรี (มี free tier)
- Google Gemini API ฟรี (มี quota)
- PostgreSQL ฟรี (local)
- ngrok ฟรี (basic plan)

### Q: รันบน VPS หรือ Cloud ได้ไหม?

A: ได้! Deploy ได้บน Railway, Render, Heroku, Google Cloud, AWS ฯลฯ

### Q: เปลี่ยนจาก Google AI เป็น OpenAI ได้ไหม?

A: ได้! แค่เปลี่ยน `AI_PROVIDER=openai` และเพิ่ม `OPENAI_API_KEY`

### Q: จำกัดจำนวน users ได้ไหม?

A: ได้ ปรับได้ที่ rate limiter ใน `src/middleware/security.ts`

### Q: เก็บข้อมูลได้นานแค่ไหน?

A: ไม่จำกัด ข้อมูลอยู่ใน PostgreSQL ถาวร

---

## 📞 ติดต่อ & Support

- GitHub Issues: <repository-url>/issues
- Email: your-email@example.com
- LINE: @your-line-id

---

✨ **ติดตั้งเสร็จแล้ว! ลองใช้งานได้เลย**
