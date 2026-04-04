# 🚀 Deployment Guide

คู่มือการ Deploy Expense Bot ไปยัง Production Environment

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development with Ngrok](#local-development-with-ngrok)
- [Cloud Platform Deployment](#cloud-platform-deployment)
  - [Render](#deploy-to-render)
  - [Railway](#deploy-to-railway)
  - [Heroku](#deploy-to-heroku)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Post-Deployment Checklist](#post-deployment-checklist)

## Prerequisites

### 1. LINE Developers Account

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider (ถ้ายังไม่มี)
3. สร้าง Messaging API Channel
4. เก็บค่าเหล่านี้:
   - `Channel Secret`
   - `Channel Access Token` (Long-lived)

### 2. Google AI API Key

1. ไปที่ [Google AI Studio](https://makersuite.google.com/app/apikey)
2. สร้าง API Key
3. เก็บค่า `API Key`

### 3. PostgreSQL Database

เลือกวิธีใดวิธีหนึ่ง:

- **Local**: PostgreSQL 14+ บนเครื่อง
- **Cloud**: Neon, Supabase, Railway, Render
- **Docker**: PostgreSQL container

## Local Development with Ngrok

สำหรับทดสอบ Webhook บนเครื่องโลคัล

### 1. Install Ngrok

```bash
# macOS (Homebrew)
brew install ngrok/ngrok/ngrok

# หรือดาวน์โหลดจาก https://ngrok.com/download
```

### 2. Setup Ngrok

```bash
# ลงทะเบียนและรับ authtoken จาก https://dashboard.ngrok.com/
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 3. Start Application

```bash
# Terminal 1: Start app
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000
```

### 4. Configure LINE Webhook

1. Copy HTTPS URL จาก ngrok (เช่น `https://abc123.ngrok-free.app`)
2. ไปที่ LINE Developers Console
3. เปิด Messaging API Channel
4. ตั้งค่า Webhook URL:
   ```
   https://abc123.ngrok-free.app/webhook
   ```
5. กด **Verify** และ **Use webhook**

### 5. Test

ส่งข้อความไปที่ LINE Bot → ควรได้รับการตอบกลับ! ✅

**หมายเหตุ:** Ngrok Free Tier จะเปลี่ยน URL ทุกครั้งที่ restart → ต้อง update Webhook URL ใหม่

## Cloud Platform Deployment

### Deploy to Render

[Render](https://render.com) - Free Tier พร้อม PostgreSQL

#### 1. Create Database

1. ไปที่ [Render Dashboard](https://dashboard.render.com/)
2. คลิก **New** → **PostgreSQL**
3. ตั้งค่า:
   - **Name**: `expense-bot-db`
   - **Region**: เลือกใกล้ที่สุด
   - **Plan**: Free
4. คลิก **Create Database**
5. เก็บ **Internal Database URL** (จะใช้ใน app)

#### 2. Create Web Service

1. คลิก **New** → **Web Service**
2. Connect GitHub repository
3. ตั้งค่า:
   - **Name**: `expense-bot`
   - **Region**: เดียวกับ Database
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npm run prisma:migrate`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### 3. Environment Variables

เพิ่ม Environment Variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=[Internal Database URL from step 1]
LINE_CHANNEL_SECRET=[Your LINE Channel Secret]
LINE_CHANNEL_ACCESS_TOKEN=[Your LINE Channel Access Token]
AI_PROVIDER=google
GOOGLE_API_KEY=[Your Google AI API Key]
```

#### 4. Deploy

1. คลิก **Create Web Service**
2. รอ build & deploy (ประมาณ 5-10 นาที)
3. เก็บ Service URL (เช่น `https://expense-bot.onrender.com`)

#### 5. Configure LINE Webhook

1. ไปที่ LINE Developers Console
2. ตั้งค่า Webhook URL:
   ```
   https://expense-bot.onrender.com/webhook
   ```
3. Verify & Enable

**ข้อจำกัด Free Tier:**

- ⏱️ Sleep หลัง 15 นาทีไม่มี request
- 🐌 Cold start ~30 วินาที
- 💾 750 ชม./เดือน

---

### Deploy to Railway

[Railway](https://railway.app) - Modern platform พร้อม PostgreSQL

#### 1. Create New Project

1. ไปที่ [Railway](https://railway.app)
2. คลิก **New Project**
3. เลือก **Deploy from GitHub repo**
4. เลือก repository

#### 2. Add PostgreSQL

1. คลิก **New** → **Database** → **Add PostgreSQL**
2. Railway จะสร้าง database อัตโนมัติ
3. Connection string จะถูกเพิ่มใน `DATABASE_URL` อัตโนมัติ

#### 3. Environment Variables

เพิ่มใน **Variables** tab:

```env
NODE_ENV=production
LINE_CHANNEL_SECRET=[Your LINE Channel Secret]
LINE_CHANNEL_ACCESS_TOKEN=[Your LINE Channel Access Token]
AI_PROVIDER=google
GOOGLE_API_KEY=[Your Google AI API Key]
```

#### 4. Configure Build & Deploy

Railway auto-detect แต่ตรวจสอบใน **Settings**:

- **Build Command**: `npm install && npm run build && npm run prisma:migrate`
- **Start Command**: `npm start`

#### 5. Get Domain

1. ไปที่ **Settings** → **Networking**
2. คลิก **Generate Domain**
3. เก็บ URL (เช่น `https://expense-bot-production.up.railway.app`)

#### 6. Configure LINE Webhook

ตั้งค่า Webhook URL:

```
https://expense-bot-production.up.railway.app/webhook
```

**ข้อดี Railway:**

- ✅ ไม่ sleep
- ✅ Deploy รวดเร็ว
- ✅ Logs ดีมาก
- 💰 $5 free credit/month

---

### Deploy to Heroku

[Heroku](https://www.heroku.com) - Classic PaaS

#### 1. Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# หรือดาวน์โหลดจาก https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Login & Create App

```bash
heroku login
heroku create expense-bot-yourname
```

#### 3. Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:essential-0
```

#### 4. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set LINE_CHANNEL_SECRET="your_secret"
heroku config:set LINE_CHANNEL_ACCESS_TOKEN="your_token"
heroku config:set AI_PROVIDER=google
heroku config:set GOOGLE_API_KEY="your_key"
```

#### 5. Deploy

```bash
git push heroku main
```

#### 6. Run Migrations

```bash
heroku run npm run prisma:migrate
```

#### 7. Get URL & Configure Webhook

```bash
heroku info
# เก็บ Web URL และตั้งค่าใน LINE Webhook
```

**หมายเหตุ:** Heroku ยกเลิก Free Tier แล้ว → ต้องจ่ายเงิน

---

## Database Setup

### Option 1: Neon (Serverless PostgreSQL)

1. ไปที่ [Neon](https://neon.tech)
2. สร้าง Project
3. เก็บ Connection String:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb
   ```
4. ใช้เป็น `DATABASE_URL`

**ข้อดี:**

- ✅ Serverless (auto-scale)
- ✅ Free tier ใจดี
- ✅ Fast

### Option 2: Supabase

1. ไปที่ [Supabase](https://supabase.com)
2. สร้าง Project
3. ไปที่ **Database** → **Connection string**
4. เก็บ URI (Connection Pooling)

### Option 3: Railway PostgreSQL

- ใช้ตอนสร้าง Project ใน Railway (แนะนำ)

## Environment Variables

### Production Configuration

```env
# App
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# LINE Bot
LINE_CHANNEL_SECRET=your_channel_secret_from_line_developers
LINE_CHANNEL_ACCESS_TOKEN=your_long_lived_access_token

# AI Provider
AI_PROVIDER=google
GOOGLE_API_KEY=your_google_ai_api_key
```

### Security Best Practices

1. **ห้ามฝัง secrets ใน code** - ใช้ environment variables เท่านั้น
2. **ใช้ Long-lived Access Token** - อย่าใช้ Short-lived
3. **Enable SSL/TLS** - Database ควรใช้ `?sslmode=require`
4. **Rotate Secrets** - เปลี่ยน API keys เป็นระยะ

## SSL/HTTPS Setup

### LINE Webhook Requirements

- ✅ **HTTPS เท่านั้น** - LINE ไม่รองรับ HTTP
- ✅ **Valid SSL Certificate** - Self-signed ไม่ได้
- ✅ **TLS 1.2+** - ต้องเป็นเวอร์ชันใหม่

### Platform SSL Support

| Platform | SSL                     | Cost |
| -------- | ----------------------- | ---- |
| Render   | ✅ Auto (Let's Encrypt) | Free |
| Railway  | ✅ Auto (Let's Encrypt) | Free |
| Heroku   | ✅ Auto                 | Free |
| Ngrok    | ✅ Auto                 | Free |

**ไม่ต้องทำอะไร** - Platforms ทั้งหมดจัดการให้อัตโนมัติ ✅

## Monitoring & Logging

### 1. Application Logs

#### Render

```bash
# Web UI: Logs tab
# หรือ CLI:
render logs --service expense-bot
```

#### Railway

```bash
# Web UI: Deployment → Logs
# หรือ CLI:
railway logs
```

#### Heroku

```bash
heroku logs --tail
```

### 2. Health Check

ทุก platform มี `/health` endpoint:

```bash
curl https://your-app.com/health

# Response:
{
  "status": "ok",
  "timestamp": "2026-03-25T12:00:00.000Z"
}
```

### 3. Database Monitoring

**Prisma Studio (Development):**

```bash
npm run prisma:studio
```

**Production:**

- Render: Database → Metrics
- Railway: Database → Metrics
- Neon: Dashboard → Metrics

### 4. Error Tracking (Optional)

เพิ่ม [Sentry](https://sentry.io):

```bash
npm install @sentry/node @sentry/profiling-node
```

```typescript
// src/app.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Post-Deployment Checklist

### ✅ Deployment Verification

- [ ] Application deployed สำเร็จ
- [ ] Database migrations รันแล้ว
- [ ] Environment variables ครบ
- [ ] HTTPS/SSL ใช้งานได้
- [ ] Health check endpoint (`/health`) ตอบกลับ

### ✅ LINE Configuration

- [ ] Webhook URL ตั้งค่าแล้ว
- [ ] Webhook Verified (เขียว)
- [ ] Use webhook เปิดแล้ว
- [ ] Auto-reply messages ปิดแล้ว (ใน LINE Official Account Manager)

### ✅ Functionality Testing

- [ ] ส่งข้อความ "สวัสดี" → Bot ตอบ?
- [ ] ส่ง "กินข้าว 120" → ได้ Flex Message ยืนยัน?
- [ ] กด "✓ ยืนยัน" → บันทึกสำเร็จ?
- [ ] ส่งรูปสลิป → OCR ทำงาน?
- [ ] ส่ง "สรุป" → แสดงสรุปรายเดือน?
- [ ] ส่ง "ล่าสุด" → แสดง 5 รายการล่าสุด?

### ✅ Performance & Monitoring

- [ ] Logs แสดงผลถูกต้อง
- [ ] ไม่มี error ใน logs
- [ ] Response time < 3 วินาที
- [ ] Database connection stable

### ✅ Security

- [ ] Webhook signature verification ทำงาน
- [ ] Rate limiting เปิดใช้งาน
- [ ] Security headers (Helmet) active
- [ ] Secrets ไม่ hardcode ใน code

## Common Issues & Solutions

### Issue: Webhook Verification Failed

**Symptoms:** LINE แสดง "Webhook URL verification failed"

**Solutions:**

1. ตรวจสอบ URL ถูกต้อง (HTTPS + `/webhook`)
2. ตรวจสอบ app รันอยู่
3. ตรวจสอบ `LINE_CHANNEL_SECRET` ถูกต้อง
4. ลองรัน health check: `https://your-app.com/health`

### Issue: Bot ไม่ตอบ

**Solutions:**

1. เช็ค logs หา errors
2. เช็ค Webhook enabled
3. เช็ค environment variables
4. เช็ค database connection

### Issue: Cold Start Slow (Render Free)

**Solutions:**

1. ยอมรับ 30 วินาทีแรก (Free tier limitation)
2. หรือ upgrade เป็น Paid plan
3. หรือใช้ Railway (ไม่ sleep)

### Issue: Database Connection Error

**Solutions:**

1. เช็ค `DATABASE_URL` format:
   ```
   postgresql://user:pass@host:5432/db?sslmode=require
   ```
2. เช็ค database มีอยู่จริง
3. เช็ค migrations รันแล้ว: `npm run prisma:migrate`

## Scaling Considerations

### 1. Vertical Scaling

**เมื่อไหร่:** Users > 100 หรือ Messages > 1000/day

**วิธี:**

- Render: Upgrade to Starter ($7/month)
- Railway: ปรับ RAM/CPU
- Heroku: Upgrade dyno type

### 2. Database Optimization

**เมื่อไหร่:** Expenses > 10,000 records

**วิธี:**

- เพิ่ม indexes ใน Prisma schema
- Connection pooling (Prisma already does this)
- Archive old data

### 3. Caching (Future)

**เมื่อไหร่:** Repeated queries ช้า

**วิธี:**

- Redis สำหรับ pending confirmations
- Cache monthly summaries

## Cost Estimates

### Free Tier (รองรับ ~100 users)

| Service       | Plan | Cost            |
| ------------- | ---- | --------------- |
| Render Web    | Free | $0              |
| Render DB     | Free | $0              |
| Google Gemini | Free | $0 (20 req/day) |
| LINE API      | Free | $0              |
| **Total**     |      | **$0/month**    |

### Production (รองรับ ~1000 users)

| Service       | Plan          | Cost             |
| ------------- | ------------- | ---------------- |
| Railway       | Hobby         | ~$5-10           |
| Google Gemini | Pay-as-you-go | ~$2-5            |
| LINE API      | Free          | $0               |
| **Total**     |               | **~$7-15/month** |

## Support & Resources

- **LINE Developers Docs**: https://developers.line.biz/en/docs/
- **Prisma Docs**: https://www.prisma.io/docs
- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **Google AI Docs**: https://ai.google.dev/docs

---

**Happy Deploying! 🚀**

อ่านเพิ่มเติม: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | [SECURITY.md](./SECURITY.md)
