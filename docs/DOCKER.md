# 🐳 Docker Guide

คู่มือการใช้งาน Docker สำหรับ Expense Bot - ตั้งแต่ Development จนถึง Production

---

## 📚 สารบัญ

1. [ทำไมต้องใช้ Docker](#ทำไมต้องใช้-docker)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Docker Commands](#docker-commands)
5. [Development Workflow](#development-workflow)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## ทำไมต้องใช้ Docker

### ประโยชน์ของ Docker

- ✅ **Consistency** - Environment เหมือนกันทุกเครื่อง (dev, staging, production)
- ✅ **Isolation** - แยก dependencies ออกจากระบบหลัก
- ✅ **Portability** - รันได้ทุกที่ที่มี Docker
- ✅ **Easy Setup** - ติดตั้งง่าย ไม่ต้องติดตั้ง Node.js, PostgreSQL แยก
- ✅ **Scalability** - Scale ได้ง่ายด้วย orchestration tools
- ✅ **CI/CD Ready** - เหมาะกับ automated deployment

### Docker Components

โปรเจ็คนี้ใช้:

- **Dockerfile** - คำสั่งสร้าง image
- **docker-compose.yml** - จัดการ multi-container
- **.dockerignore** - ไฟล์ที่ไม่ต้อง copy เข้า image

---

## Prerequisites

### ติดตั้ง Docker

```bash
# macOS
brew install --cask docker

# Linux (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Windows
# ดาวน์โหลด Docker Desktop จาก https://www.docker.com/products/docker-desktop
```

### ตรวจสอบการติดตั้ง

```bash
# ตรวจสอบ Docker
docker --version
# Output: Docker version 24.x.x

# ตรวจสอบ Docker Compose
docker-compose --version
# Output: Docker Compose version 2.x.x

# ทดสอบรัน
docker run hello-world
```

---

## Quick Start

### Option 1: Docker Compose (แนะนำ)

วิธีที่ง่ายที่สุด - รัน app และ database พร้อมกัน

```bash
# 1. Clone repository
git clone <repository-url>
cd expense-bot

# 2. Copy environment file
cp .env.example .env

# 3. แก้ไข .env ให้ครบถ้วน
nano .env

# 4. รันทุกอย่างด้วยคำสั่งเดียว
docker-compose up -d

# 5. ตรวจสอบ logs
docker-compose logs -f app

# 6. ตรวจสอบสถานะ
docker-compose ps
```

### Option 2: Docker ธรรมดา

รัน container แยกทีละตัว

```bash
# 1. สร้าง network
docker network create expense-bot-network

# 2. รัน PostgreSQL
docker run -d \
  --name expense-bot-db \
  --network expense-bot-network \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=expensebot \
  -p 5432:5432 \
  postgres:16-alpine

# 3. รอ database พร้อม
sleep 10

# 4. Build app image
docker build -t expense-bot .

# 5. รัน app
docker run -d \
  --name expense-bot-app \
  --network expense-bot-network \
  -e DATABASE_URL=postgresql://postgres:password@expense-bot-db:5432/expensebot \
  -e LINE_CHANNEL_SECRET=your_secret \
  -e LINE_CHANNEL_ACCESS_TOKEN=your_token \
  -e GOOGLE_API_KEY=your_api_key \
  -p 3000:3000 \
  expense-bot

# 6. ดู logs
docker logs -f expense-bot-app
```

### Option 3: Development Mode

รัน development environment พร้อม hot reload

```bash
# สร้าง docker-compose.dev.yml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: expensebot
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build:
      context: .
      target: builder
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@db:5432/expensebot
    ports:
      - "3000:3000"
    command: npm run dev
    depends_on:
      - db

volumes:
  postgres_data:

# รัน
docker-compose -f docker-compose.dev.yml up
```

---

## Docker Commands

### การจัดการ Containers

```bash
# รัน services
docker-compose up                    # Foreground
docker-compose up -d                 # Background (detached)

# หยุด services
docker-compose stop                  # หยุดชั่วคราว
docker-compose down                  # หยุดและลบ containers
docker-compose down -v               # หยุด + ลบ volumes (ข้อมูลหายหมด!)

# Restart services
docker-compose restart               # Restart ทุกอันทีเดียว
docker-compose restart app           # Restart เฉพาะ app

# ดูสถานะ
docker-compose ps                    # สถานะ containers
docker-compose top                   # Process ที่รันอยู่
```

### การดู Logs

```bash
# ดู logs ทุก services
docker-compose logs

# ดู logs แบบ real-time
docker-compose logs -f

# ดู logs เฉพาะ service
docker-compose logs app
docker-compose logs db

# ดู logs แค่ 100 บรรทัดล่าสุด
docker-compose logs --tail=100 app

# ดู logs ตามช่วงเวลา
docker-compose logs --since 30m app
```

### การเข้าถึง Container

```bash
# เข้า shell ของ app
docker-compose exec app sh

# เข้า shell ของ database
docker-compose exec db psql -U postgres -d expensebot

# รัน command ครั้งเดียว
docker-compose exec app npm test
docker-compose exec app npx prisma studio
docker-compose exec db pg_dump -U postgres expensebot > backup.sql
```

### Database Management

```bash
# Run migrations
docker-compose exec app npx prisma migrate dev
docker-compose exec app npx prisma migrate deploy

# Generate Prisma Client
docker-compose exec app npx prisma generate

# เปิด Prisma Studio
docker-compose exec app npx prisma studio
# เข้าที่ http://localhost:5555

# Backup database
docker-compose exec db pg_dump -U postgres expensebot > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T db psql -U postgres expensebot < backup.sql

# Reset database (Development only!)
docker-compose exec app npx prisma migrate reset
```

### Build & Images

```bash
# Build image
docker-compose build                 # Build ทุก services
docker-compose build --no-cache      # Build ใหม่ไม่ใช้ cache
docker-compose build app             # Build เฉพาะ app

# ดู images
docker images

# ลบ images ที่ไม่ใช้
docker image prune
docker image prune -a                # ลบทั้งหมด

# Tag และ push image
docker tag expense-bot:latest username/expense-bot:v1.0.0
docker push username/expense-bot:v1.0.0
```

### Monitoring

```bash
# ดู resource usage
docker stats

# ดูเฉพาะ expense bot containers
docker stats expense-bot-app expense-bot-db

# ดู container details
docker inspect expense-bot-app

# Health check status
docker inspect --format='{{.State.Health.Status}}' expense-bot-app
```

---

## Development Workflow

### 1. Local Development Setup

```bash
# Clone และ setup
git clone <repo>
cd expense-bot
cp .env.example .env

# แก้ไข .env
LINE_CHANNEL_SECRET=xxx
LINE_CHANNEL_ACCESS_TOKEN=xxx
GOOGLE_API_KEY=xxx
DB_PASSWORD=password

# รัน development environment
docker-compose up -d

# ดู logs
docker-compose logs -f app
```

### 2. Database Migrations

```bash
# สร้าง migration ใหม่
docker-compose exec app npx prisma migrate dev --name add_new_field

# ดู migration status
docker-compose exec app npx prisma migrate status

# Apply migrations
docker-compose exec app npx prisma migrate deploy
```

### 3. Testing

```bash
# รัน tests
docker-compose exec app npm test

# รัน tests with coverage
docker-compose exec app npm run test:coverage

# รัน specific test file
docker-compose exec app npm test expense.test.ts
```

### 4. Debugging

```bash
# ดู logs แบบ real-time
docker-compose logs -f app

# เข้า container shell
docker-compose exec app sh

# ตรวจสอบ environment variables
docker-compose exec app env | grep LINE

# ตรวจสอบ network
docker network inspect expense-bot-network

# ตรวจสอบ database connection
docker-compose exec app node -e "
  const { PrismaClient } = require('./src/generated/prisma');
  const prisma = new PrismaClient();
  prisma.\$connect().then(() => console.log('Connected!')).catch(console.error);
"
```

### 5. Hot Reload (Development)

สำหรับ hot reload ใน development:

แก้ไข `docker-compose.yml`:

```yaml
services:
  app:
    build:
      context: .
      target: builder # ใช้ builder stage
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev # ใช้ nodemon
```

---

## Production Deployment

### Environment Variables

สร้างไฟล์ `.env.production`:

```env
NODE_ENV=production
PORT=3000

# Database
DB_PASSWORD=strong_password_here
DB_NAME=expensebot

# LINE
LINE_CHANNEL_SECRET=production_secret
LINE_CHANNEL_ACCESS_TOKEN=production_token

# AI
AI_PROVIDER=google
GOOGLE_API_KEY=production_api_key
```

### Deploy บน Server

```bash
# 1. Clone repository
git clone <repo>
cd expense-bot

# 2. Setup environment
cp .env.production .env
nano .env  # แก้ไขค่าจริง

# 3. Build และรัน
docker-compose up -d

# 4. Run migrations
docker-compose exec app npx prisma migrate deploy

# 5. ตรวจสอบ health
curl http://localhost:3000/health
```

### Deploy บน Cloud Platforms

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Render

```yaml
# render.yaml
services:
  - type: web
    name: expense-bot
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: expensebot-db
          property: connectionString
```

#### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: expense-bot
services:
  - name: web
    dockerfile_path: Dockerfile
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
databases:
  - name: db
    engine: PG
    version: "16"
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/expense-bot
server {
    listen 80;
    server_name bot.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL with Let's Encrypt

```bash
# ติดตั้ง Certbot
sudo apt install certbot python3-certbot-nginx

# สร้าง SSL certificate
sudo certbot --nginx -d bot.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Troubleshooting

### ❌ Container ไม่ขึ้น

```bash
# ดู logs
docker-compose logs

# ตรวจสอบ container status
docker-compose ps

# ลองรันใหม่
docker-compose down
docker-compose up -d

# Build ใหม่
docker-compose build --no-cache
docker-compose up -d
```

### ❌ Database Connection Error

```bash
# ตรวจสอบว่า db container รันอยู่
docker-compose ps db

# ตรวจสอบ database logs
docker-compose logs db

# ทดสอบ connection
docker-compose exec db psql -U postgres -c "SELECT 1"

# ตรวจสอบ DATABASE_URL
docker-compose exec app env | grep DATABASE_URL
```

### ❌ Port Already in Use

```bash
# หา process ที่ใช้ port
lsof -i :3000
lsof -i :5432

# Kill process
kill -9 <PID>

# หรือเปลี่ยน port ใน .env
PORT=3001
DB_PORT=5433
```

### ❌ Out of Disk Space

```bash
# ดู disk usage
docker system df

# ลบ unused data
docker system prune

# ลบทุกอย่างรวม volumes
docker system prune -a --volumes
```

### ❌ Migration Failed

```bash
# ดู migration status
docker-compose exec app npx prisma migrate status

# Reset database (Development only!)
docker-compose exec app npx prisma migrate reset

# ใน Production - rollback manual
docker-compose exec db psql -U postgres expensebot < backup.sql
```

### ❌ Memory Issues

```bash
# เพิ่ม memory limit ใน docker-compose.yml
services:
  app:
    mem_limit: 512m
    mem_reservation: 256m

# Restart
docker-compose up -d
```

---

## Best Practices

### 1. Security

```yaml
# Use secrets for sensitive data
services:
  app:
    secrets:
      - line_secret
      - google_api_key

secrets:
  line_secret:
    file: ./secrets/line_secret.txt
  google_api_key:
    file: ./secrets/google_api_key.txt
```

### 2. Health Checks

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 3. Logging

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
```

### 5. Backup Strategy

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose exec -T db pg_dump -U postgres expensebot > \
  "${BACKUP_DIR}/db_${DATE}.sql"

# Compress
gzip "${BACKUP_DIR}/db_${DATE}.sql"

# Delete old backups (keep 7 days)
find "${BACKUP_DIR}" -name "db_*.sql.gz" -mtime +7 -delete

# Run daily via cron
# 0 2 * * * /path/to/backup.sh
```

### 6. Monitoring

```yaml
# Add monitoring service
services:
  # ... existing services ...

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Useful Tools

### Adminer (Database GUI)

```bash
# รัน Adminer
docker-compose --profile tools up -d

# เข้าที่ http://localhost:8080
# Server: db
# Username: postgres
# Password: <DB_PASSWORD>
# Database: expensebot
```

### Portainer (Docker GUI)

```bash
docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce

# เข้าที่ http://localhost:9000
```

---

## Cheat Sheet

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Shell
docker-compose exec app sh

# Database
docker-compose exec db psql -U postgres expensebot

# Migrations
docker-compose exec app npx prisma migrate deploy

# Tests
docker-compose exec app npm test

# Backup
docker-compose exec db pg_dump -U postgres expensebot > backup.sql

# Rebuild
docker-compose build --no-cache && docker-compose up -d

# Clean
docker-compose down -v && docker system prune -a
```

---

## Next Steps

1. ✅ Setup Docker environment
2. ✅ Deploy production
3. 📚 อ่าน [Setup Guide](./SETUP_GUIDE.md)
4. 🏗️ อ่าน [Architecture](./ARCHITECTURE.md)
5. 🧪 อ่าน [Testing Guide](./TESTING_GUIDE.md)

---

🐳 **Happy Dockerizing!**
