---
name: deploy-production
description: Complete production deployment checklist for Expense Bot with Docker, database setup, and monitoring
tags:
  - deployment
  - production
  - docker
  - devops
---

# Production Deployment Guide

Complete checklist and procedures for deploying Expense Bot to production.

## Pre-Deployment Checklist

### 1. Code Readiness

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Code reviewed and approved
- [ ] Security vulnerabilities checked (`npm audit`)
- [ ] Environment variables documented in `.env.example`

### 2. Database Preparation

- [ ] Backup existing database
- [ ] Migrations tested in staging
- [ ] Database indexes optimized
- [ ] Connection pool size configured

### 3. Environment Setup

- [ ] Production `.env` file prepared
- [ ] Secrets stored securely (not in code)
- [ ] SSL/TLS certificates ready
- [ ] Domain name configured
- [ ] Firewall rules set

## Deployment Options

### Option 1: Docker Compose (Recommended)

#### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y

# Create application directory
sudo mkdir -p /opt/expense-bot
cd /opt/expense-bot
```

#### Step 2: Clone Repository

```bash
# Clone your repository
git clone <your-repo-url> .

# Or pull latest changes
git pull origin main
```

#### Step 3: Configure Environment

```bash
# Create production .env
cp .env.example .env
nano .env
```

**Required Environment Variables:**

```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@db:5432/expensebot

# LINE Bot
LINE_CHANNEL_SECRET=your_production_secret
LINE_CHANNEL_ACCESS_TOKEN=your_production_token

# AI Provider
AI_PROVIDER=google
GOOGLE_API_KEY=your_production_api_key

# Security
TRUST_PROXY=true
```

#### Step 4: Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

#### Step 5: Run Migrations

```bash
# Apply database migrations
docker-compose exec app npx prisma migrate deploy

# Verify database
docker-compose exec app npx prisma db pull
```

#### Step 6: Verify Deployment

```bash
# Check logs
docker-compose logs -f app

# Test health endpoint
curl http://localhost:3000/health

# Test webhook (with ngrok or production URL)
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
```

### Option 2: PM2 (Without Docker)

#### Step 1: Install Dependencies

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

#### Step 2: Setup Application

```bash
# Clone repository
git clone <your-repo-url> /opt/expense-bot
cd /opt/expense-bot

# Install dependencies
npm ci --production

# Build TypeScript
npm run build
```

#### Step 3: Configure PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE expensebot;
CREATE USER expensebot_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE expensebot TO expensebot_user;
\q
```

#### Step 4: Configure Environment

```bash
cp .env.example .env
nano .env

# Update DATABASE_URL
DATABASE_URL=postgresql://expensebot_user:secure_password@localhost:5432/expensebot
```

#### Step 5: Run Migrations

```bash
npx prisma migrate deploy
```

#### Step 6: Start with PM2

```bash
# Start application
pm2 start dist/index.js --name expense-bot

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Reverse Proxy Setup (nginx)

### Install nginx

```bash
sudo apt install nginx -y
```

### Configure nginx

Create `/etc/nginx/sites-available/expense-bot`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/expense-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## LINE Webhook Configuration

### Update LINE Webhook URL

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Select your channel
3. Go to **Messaging API** tab
4. Update **Webhook URL**: `https://your-domain.com/webhook`
5. Enable **Use webhook**
6. Click **Verify** to test

## Monitoring Setup

### PM2 Monitoring

```bash
# View logs
pm2 logs expense-bot

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Docker Monitoring

```bash
# View logs
docker-compose logs -f app

# Container stats
docker stats

# Health check
docker-compose ps
```

### Log Rotation

For PM2:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Database Backup

### Automated Backup Script

Create `/opt/scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="expensebot_${DATE}.sql"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db pg_dump -U postgres expensebot > "${BACKUP_DIR}/${FILENAME}"

# Compress backup
gzip "${BACKUP_DIR}/${FILENAME}"

# Delete old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Make executable and schedule:

```bash
chmod +x /opt/scripts/backup-db.sh
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/scripts/backup-db.sh
```

## Update Deployment

### Zero-Downtime Update (Docker)

```bash
# Pull latest changes
git pull origin main

# Build new image
docker-compose build

# Rolling update
docker-compose up -d --no-deps --build app
```

### Update with PM2

```bash
# Pull changes
git pull origin main

# Install dependencies
npm ci --production

# Build
npm run build

# Reload (zero-downtime)
pm2 reload expense-bot
```

## Rollback Procedures

### Docker Rollback

```bash
# Revert to previous commit
git reset --hard HEAD~1

# Rebuild and restart
docker-compose up -d --build
```

### PM2 Rollback

```bash
# Stop application
pm2 stop expense-bot

# Restore from backup
git reset --hard <commit-hash>
npm ci --production
npm run build

# Start
pm2 start expense-bot
```

## Troubleshooting

### Application Won't Start

**Check logs:**

```bash
docker-compose logs app
# or
pm2 logs expense-bot
```

**Common issues:**

- Database connection string incorrect
- Missing environment variables
- Port already in use

### Database Connection Issues

**Test connection:**

```bash
docker-compose exec app npx prisma db pull
```

**Check PostgreSQL:**

```bash
docker-compose exec db psql -U postgres -d expensebot
```

### LINE Webhook Not Working

**Verify signature:**

- Check `LINE_CHANNEL_SECRET` is correct
- Ensure webhook URL is https://
- Check nginx proxy headers

**Test manually:**

```bash
curl -X POST https://your-domain.com/webhook \
  -H "X-Line-Signature: test" \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
```

## Security Hardening

### Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Update LINE Webhook IP Whitelist

Only allow LINE's webhook IPs in nginx.

### Regular Updates

```bash
# Weekly security updates
sudo apt update && sudo apt upgrade -y
```

## Performance Optimization

### Database Connection Pool

In `.env`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10
```

### Rate Limiting

Already configured in `src/middleware/security.ts`

### Caching (Future Enhancement)

Consider adding Redis for:

- Monthly summary caching
- User session data
- Rate limit counters

## Related Documentation

- `docs/DOCKER.md` - Docker setup details
- `README.md` - General setup guide
- `SKILL.md` - Project architecture

## Support Contacts

- Infrastructure: IT team
- Database: DBA team
- Application: Development team
