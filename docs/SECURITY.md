# 🔒 Security Guide

Security best practices and configurations for Expense Bot

## 📋 Overview

Expense Bot implements multiple layers of security to protect user data and prevent unauthorized access.

## 🛡️ Security Layers

### 1. LINE Webhook Signature Verification

**Purpose:** Verify that webhook requests actually come from LINE

**Implementation:**

```typescript
// src/middleware/lineSignature.ts
export function verifyLineSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const signature = req.headers["x-line-signature"] as string;
  const body = JSON.stringify(req.body);

  const hash = crypto
    .createHmac("SHA256", config.LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");

  if (signature !== hash) {
    throw new ValidationError("Invalid signature");
  }

  next();
}
```

**Attack Prevention:**

- ✅ Prevents replay attacks
- ✅ Prevents request forgery
- ✅ Ensures request authenticity

**Configuration:**

```env
LINE_CHANNEL_SECRET=your_32_character_secret_here
```

**⚠️ Important:**

- Never expose `LINE_CHANNEL_SECRET` in code
- Never commit `.env` file
- Rotate secret if compromised

---

### 2. Rate Limiting

**Purpose:** Prevent abuse and DDoS attacks

**Implementation:**

```typescript
// src/middleware/security.ts
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests",
  standardHeaders: true,
  legacyHeaders: false,
});

export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Limits:**

- Global: 100 requests / 15 min
- Webhook: 300 requests / 15 min

**Response:**

```json
HTTP 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

**Bypass for Testing:**

```typescript
// In development only
if (process.env.NODE_ENV === "development") {
  // Skip rate limiting
}
```

---

### 3. Security Headers (Helmet)

**Purpose:** Protect against common web vulnerabilities

**Implementation:**

```typescript
// src/app.ts
app.use(helmet());
```

**Headers Added:**

```http
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'
```

**Protections:**

- ✅ Clickjacking (X-Frame-Options)
- ✅ MIME sniffing (X-Content-Type-Options)
- ✅ XSS (Content-Security-Policy)
- ✅ HTTPS enforcement (HSTS)

---

### 4. Environment Variables Validation

**Purpose:** Ensure all required secrets are present

**Implementation:**

```typescript
// src/config/index.ts
const envSchema = z.object({
  LINE_CHANNEL_SECRET: z.string().min(1),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().url(),
  GOOGLE_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables");
  throw new Error("Invalid environment configuration");
}
```

**Benefits:**

- ✅ Fail fast on missing config
- ✅ Type-safe configuration
- ✅ Clear error messages

---

### 5. Database Security

**Purpose:** Protect database access and data

**PostgreSQL Configuration:**

```env
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
```

**Features:**

- ✅ SSL/TLS encryption (`sslmode=require`)
- ✅ Connection pooling (prevent connection exhaustion)
- ✅ Prepared statements (prevent SQL injection)

**Prisma Security:**

```typescript
// src/db/prisma.ts
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
```

**Best Practices:**

- ✅ Use Prisma ORM (no raw SQL)
- ✅ Input validation with Zod
- ✅ Parameterized queries (Prisma handles this)

---

### 6. HTTPS/TLS

**Purpose:** Encrypt data in transit

**LINE Requirements:**

- ✅ HTTPS only (no HTTP)
- ✅ Valid SSL certificate
- ✅ TLS 1.2+

**Cloud Platforms:**
| Platform | SSL | Auto-renewal |
|----------|-----|--------------|
| Render | ✅ Let's Encrypt | ✅ Auto |
| Railway | ✅ Let's Encrypt | ✅ Auto |
| Heroku | ✅ Let's Encrypt | ✅ Auto |

**Testing:**

```bash
# Check SSL certificate
curl -vI https://your-domain.com 2>&1 | grep "SSL certificate verify ok"
```

---

## 🔐 Secrets Management

### Best Practices

#### 1. Never Hardcode Secrets

❌ **Bad:**

```typescript
const apiKey = "AIzaSyABC123...";
```

✅ **Good:**

```typescript
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error("GOOGLE_API_KEY required");
```

#### 2. Use `.env` for Local Development

```bash
# .env (never commit this!)
LINE_CHANNEL_SECRET=abc123...
LINE_CHANNEL_ACCESS_TOKEN=xyz789...
GOOGLE_API_KEY=AIza...
```

**Add to `.gitignore`:**

```
.env
.env.local
.env.*.local
```

#### 3. Use Platform Environment Variables for Production

**Render:**

```bash
# Dashboard → Environment → Add Environment Variable
LINE_CHANNEL_SECRET=abc123...
```

**Railway:**

```bash
railway variables set LINE_CHANNEL_SECRET=abc123...
```

**Heroku:**

```bash
heroku config:set LINE_CHANNEL_SECRET=abc123...
```

#### 4. Rotate Secrets Regularly

**Schedule:**

- LINE tokens: Every 6 months
- Google API keys: Every 6 months
- Database passwords: Every 3 months

**Process:**

1. Generate new secret
2. Update in environment
3. Deploy
4. Revoke old secret
5. Monitor for errors

---

## 🔍 Input Validation

### User Input

**All user text input is validated:**

```typescript
// Example: Text message validation
const text = message.text?.trim();
if (!text || text.length > 1000) {
  throw new ValidationError("Invalid message");
}
```

**Limits:**

- Max text length: 1000 characters
- Amount: Must be positive number
- Category: Must be in allowed list

### Request Validation

**Zod schema validation:**

```typescript
const MessageSchema = z.object({
  events: z.array(
    z.object({
      type: z.enum(["message", "postback"]),
      replyToken: z.string(),
      source: z.object({
        userId: z.string(),
      }),
    })
  ),
});
```

**Benefits:**

- ✅ Type safety
- ✅ Runtime validation
- ✅ Clear error messages

---

## 🚨 Error Handling

### Information Disclosure Prevention

**Production:**

```typescript
if (config.NODE_ENV === "production") {
  return res.status(500).json({
    error: { message: "Something went wrong" },
  });
}
```

**Development:**

```typescript
if (config.NODE_ENV === "development") {
  return res.status(500).json({
    error: { message: err.message, stack: err.stack },
  });
}
```

**Never expose:**

- ❌ Stack traces (production)
- ❌ Database errors
- ❌ API keys
- ❌ Internal paths

---

## 📊 Logging Best Practices

### What to Log

✅ **Safe to log:**

- Request method & path
- Status codes
- User IDs (hashed if sensitive)
- Timestamps
- Error types

❌ **Never log:**

- Passwords
- API keys
- Credit card numbers
- Full error stack in production
- Personal identifiable information (PII)

### Example

```typescript
// Good
logger.info("User action", {
  userId: hashUserId(userId),
  action: "expense_created",
  timestamp: new Date(),
});

// Bad
logger.info("User action", {
  userId: userId, // Plain text
  apiKey: process.env.GOOGLE_API_KEY, // Secret!
  message: fullMessage, // May contain PII
});
```

---

## 🔒 Data Protection

### User Data

**What we store:**

- LINE User ID (hashed)
- Expenses (amount, category, description, date)
- No personal information (name, email, phone)

**What we don't store:**

- Chat history
- Profile information
- Location data
- Images (deleted after OCR)

### Data Retention

```typescript
// Example: Auto-delete old data
async function cleanupOldData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  await prisma.expense.deleteMany({
    where: {
      date: { lt: sixMonthsAgo },
    },
  });
}
```

### GDPR Compliance (if applicable)

**User rights:**

- Right to access data
- Right to delete data
- Right to export data

**Implementation:**

```typescript
// Delete user data
async function deleteUserData(userId: string) {
  await prisma.expense.deleteMany({ where: { userId } });
  await prisma.category.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { lineUserId: userId } });
}
```

---

## 🛡️ Security Checklist

### Development

- [ ] `.env` in `.gitignore`
- [ ] No hardcoded secrets
- [ ] Input validation on all endpoints
- [ ] Error handling doesn't expose internals
- [ ] Dependencies updated regularly

### Deployment

- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Rate limiting active
- [ ] Helmet middleware active
- [ ] LINE signature verification active
- [ ] Database SSL enabled

### Monitoring

- [ ] Error tracking (Sentry optional)
- [ ] Log aggregation
- [ ] Rate limit monitoring
- [ ] Failed auth attempts logged

### Maintenance

- [ ] Rotate secrets every 3-6 months
- [ ] Update dependencies monthly
- [ ] Review logs weekly
- [ ] Security audit quarterly

---

## 🚨 Incident Response

### If Secret is Compromised

**Immediate actions:**

1. **Revoke compromised secret**

   ```bash
   # LINE: Regenerate token in LINE Console
   # Google: Delete API key in Google Cloud Console
   ```

2. **Update environment variables**

   ```bash
   railway variables set LINE_CHANNEL_SECRET=NEW_SECRET
   ```

3. **Deploy immediately**

   ```bash
   git push origin main
   ```

4. **Monitor logs**

   ```bash
   railway logs --tail
   ```

5. **Check for unauthorized access**
   - Review recent expenses
   - Check unusual user activity
   - Verify no data exfiltration

### If Database is Compromised

1. **Disconnect database**
2. **Assess damage**
3. **Restore from backup**
4. **Rotate all credentials**
5. **Notify users (if PII affected)**

---

## 📚 Security Resources

### Tools

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Check for vulnerabilities
- [Snyk](https://snyk.io/) - Continuous security scanning
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Common vulnerabilities

### Commands

```bash
# Check for vulnerabilities
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix

# Check outdated packages
npm outdated

# Update dependencies
npm update
```

### Best Practices

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🔐 Security Headers Detail

### Strict-Transport-Security (HSTS)

```http
Strict-Transport-Security: max-age=15552000; includeSubDomains
```

**Purpose:** Force HTTPS for 180 days

### X-Frame-Options

```http
X-Frame-Options: SAMEORIGIN
```

**Purpose:** Prevent clickjacking

### X-Content-Type-Options

```http
X-Content-Type-Options: nosniff
```

**Purpose:** Prevent MIME sniffing

### Content-Security-Policy

```http
Content-Security-Policy: default-src 'self'
```

**Purpose:** Prevent XSS attacks

**Custom CSP (if needed):**

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
```

---

## 🎯 Common Vulnerabilities & Mitigations

### SQL Injection

**Risk:** Attacker manipulates database queries

**Mitigation:**

- ✅ Use Prisma ORM (no raw SQL)
- ✅ Parameterized queries
- ✅ Input validation

### XSS (Cross-Site Scripting)

**Risk:** Attacker injects malicious scripts

**Mitigation:**

- ✅ Helmet CSP headers
- ✅ No user content rendered in HTML
- ✅ LINE handles all UI rendering

### CSRF (Cross-Site Request Forgery)

**Risk:** Attacker tricks user into making unwanted requests

**Mitigation:**

- ✅ LINE signature verification
- ✅ Stateless API (no cookies)
- ✅ Webhook-only endpoint

### DoS (Denial of Service)

**Risk:** Attacker overwhelms server

**Mitigation:**

- ✅ Rate limiting
- ✅ Request size limits
- ✅ Timeout configurations

---

**Stay Secure! 🔒**

อ่านเพิ่มเติม: [DEPLOYMENT.md](./DEPLOYMENT.md) | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
