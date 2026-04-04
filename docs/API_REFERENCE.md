# 📡 API Reference

Complete API documentation for Expense Bot webhooks and endpoints

## 🌐 Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## 🔐 Authentication

All LINE webhook requests are verified using **HMAC-SHA256 signature verification**.

### Request Headers

```http
X-Line-Signature: {signature}
Content-Type: application/json
```

### Signature Verification

```typescript
const signature = crypto
  .createHmac("SHA256", channelSecret)
  .update(rawBody)
  .digest("base64");

if (signature !== requestSignature) {
  throw new Error("Invalid signature");
}
```

## 📋 Endpoints

### 1. Health Check

**GET** `/health`

Check if the service is running.

**Request:**

```bash
curl https://your-domain.com/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-25T12:00:00.000Z"
}
```

**Status Codes:**

- `200` - Service is healthy
- `500` - Service error

---

### 2. LINE Webhook

**POST** `/webhook`

Receives events from LINE Messaging API.

**Headers:**

```
X-Line-Signature: {signature}
Content-Type: application/json
```

**Request Body:**

```json
{
  "destination": "U...",
  "events": [
    {
      "type": "message",
      "replyToken": "...",
      "source": {
        "userId": "U123456789abcdef",
        "type": "user"
      },
      "timestamp": 1234567890123,
      "message": {
        "id": "...",
        "type": "text",
        "text": "กินข้าว 120"
      }
    }
  ]
}
```

**Response:**

```json
{
  "status": "ok"
}
```

**Status Codes:**

- `200` - Success
- `400` - Invalid signature or payload
- `429` - Rate limit exceeded
- `500` - Server error

---

## 📨 Event Types

### Message Events

#### Text Message

```json
{
  "type": "message",
  "replyToken": "abc123...",
  "source": {
    "userId": "U123456789abcdef",
    "type": "user"
  },
  "timestamp": 1234567890123,
  "message": {
    "id": "456789",
    "type": "text",
    "text": "กินข้าว 120"
  }
}
```

**Bot Behavior:**

1. Parse text with AI
2. Send confirmation Flex Message
3. Store in pending (5 min TTL)
4. Reply with "⏳ กำลังเตรียมข้อมูล..."

---

#### Image Message

```json
{
  "type": "message",
  "replyToken": "abc123...",
  "source": {
    "userId": "U123456789abcdef",
    "type": "user"
  },
  "timestamp": 1234567890123,
  "message": {
    "id": "456789",
    "type": "image",
    "contentProvider": {
      "type": "line"
    }
  }
}
```

**Bot Behavior:**

1. Reply "⏳ กำลังอ่านสลิป รอสักครู่นะคะ..."
2. Download image from LINE CDN
3. OCR with Google Gemini Vision
4. Send confirmation Flex Message
5. Store in pending (5 min TTL)

**Error Handling:**

- OCR failed → Send error message via pushMessage
- Invalid image → Error message

---

### Postback Events

#### Confirm Expense

```json
{
  "type": "postback",
  "replyToken": "abc123...",
  "source": {
    "userId": "U123456789abcdef",
    "type": "user"
  },
  "timestamp": 1234567890123,
  "postback": {
    "data": "action=confirm_expense"
  }
}
```

**Bot Behavior:**

1. Get pending confirmation from store
2. Validate data (amount not null)
3. Save to database
4. Delete pending
5. Reply success message

**Response:**

```
💸 บันทึกรายจ่ายแล้วค่ะ!
💰 จำนวน: 120 บาท
📝 รายละเอียด: กินข้าว
🏷️ หมวดหมู่: อาหาร
```

**Error Cases:**

- Pending expired (> 5 min) → "หมดเวลายืนยันแล้ว"
- Amount is null → "ข้อมูลไม่ครบ"
- Database error → Generic error message

---

#### Cancel Expense

```json
{
  "type": "postback",
  "replyToken": "abc123...",
  "source": {
    "userId": "U123456789abcdef",
    "type": "user"
  },
  "timestamp": 1234567890123,
  "postback": {
    "data": "action=cancel_expense"
  }
}
```

**Bot Behavior:**

1. Delete pending confirmation
2. Reply cancellation message

**Response:**

```
ยกเลิกแล้วค่ะ 👌
ถ้าอยากบันทึกใหม่ ส่งข้อมูลมาได้เลยนะคะ
```

---

## 🔤 Command Messages

### Help Command

**Input:** `วิธีใช้` or `help`

**Output:**

```
📖 วิธีใช้ Expense Bot

📝 บันทึกรายจ่าย:
ส่งข้อความ เช่น "กินข้าว 120" หรือ "ค่ารถ 44 บาท"

💰 บันทึกรายรับ:
ส่งข้อความ เช่น "รับเงินเดือน 30000"

📊 ดูสรุปรายเดือน:
พิมพ์ "สรุป" หรือ "summary"

📋 ดู 5 รายการล่าสุด:
พิมพ์ "ล่าสุด" หรือ "recent"

📸 บันทึกด้วยรูปสลิป:
ส่งรูปสลิปให้ Bot อ่านอัตโนมัติ
```

---

### Summary Command

**Input:** `สรุป` or `summary`

**Output:**

```
📊 สรุปรายการ มี.ค. 2026

💰 รายรับรวม: 30,000 บาท
💸 รายจ่ายรวม: 8,420 บาท
💵 คงเหลือ: 21,580 บาท

📋 รายจ่ายตามหมวดหมู่:
1. อาหาร - 3,200 บาท
2. เดินทาง - 2,100 บาท
3. ช้อปปิ้ง - 1,800 บาท
4. การศึกษา - 1,320 บาท
```

**API Call:**

```typescript
GET /api/summary?userId={userId}&month={YYYY-MM}
```

---

### Recent Command

**Input:** `ล่าสุด` or `recent`

**Output:**

```
5 รายการล่าสุด:

💸 กินข้าว — 120 บาท
   📅 25 มี.ค. 2026 | 🏷️ อาหาร

💸 ค่ารถ BTS — 44 บาท
   📅 25 มี.ค. 2026 | 🏷️ เดินทาง

💰 รับเงินเดือน — 30,000 บาท
   📅 1 มี.ค. 2026 | 🏷️ เงินเดือน
```

**API Call:**

```typescript
GET /api/recent?userId={userId}&limit=5
```

---

## 📊 Data Models

### ParsedExpense

```typescript
interface ParsedExpense {
  type: "INCOME" | "EXPENSE" | "UNKNOWN";
  amount: number | null;
  description: string;
  category: string;
}
```

**Example:**

```json
{
  "type": "EXPENSE",
  "amount": 120,
  "description": "กินข้าว",
  "category": "อาหาร"
}
```

---

### OcrResult

```typescript
interface OcrResult {
  type: "INCOME" | "EXPENSE";
  amount: number | null;
  description: string;
  category: string;
  merchant?: string;
  date?: string;
  confidence: "high" | "medium" | "low";
}
```

**Example:**

```json
{
  "type": "EXPENSE",
  "amount": 120,
  "description": "ค่าอาหาร",
  "category": "อาหาร",
  "merchant": "ร้านอาหาร ABC",
  "date": "2026-03-25",
  "confidence": "high"
}
```

---

### PendingConfirmation

```typescript
interface PendingConfirmation {
  ocrResult?: OcrResult;
  parsedExpense?: ParsedExpense;
  imageMessageId?: string;
  expiresAt: Date;
}
```

**TTL:** 5 minutes

---

## 🔄 Workflow Diagrams

### Text Message Flow

```
User sends text
      ↓
Parse with AI (Gemini)
      ↓
  [Success?]
  ↙      ↘
Yes        No
 ↓          ↓
Send      Fallback
Flex Msg   Parser
 ↓          ↓
Store    Send Flex
Pending     ↓
 ↓       Store
User      Pending
clicks
 ↓
[Confirm or Cancel?]
 ↙              ↘
Confirm        Cancel
 ↓              ↓
Save to DB   Delete
Delete       Pending
Pending       ↓
 ↓          Reply
Reply       Cancel
Success      Msg
```

### Image Message Flow

```
User sends image
      ↓
Reply "processing..."
      ↓
Download image
      ↓
OCR (Gemini Vision)
      ↓
  [Success?]
  ↙      ↘
Yes        No
 ↓          ↓
Send      Push
Flex Msg   Error
 ↓          Msg
Store
Pending
 ↓
[User Action]
 ↙      ↘
Confirm  Cancel
 ↓        ↓
Save    Delete
 ↓        ↓
Reply   Reply
```

---

## 🚨 Error Handling

### Error Types

```typescript
class AppError extends Error {
  statusCode: number;
  code: string;
}

class ValidationError extends AppError {
  // statusCode: 400
  // code: "VALIDATION_ERROR"
}

class ExternalServiceError extends AppError {
  // statusCode: 503
  // code: "EXTERNAL_SERVICE_ERROR"
}
```

### Error Responses

**Validation Error:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload"
  }
}
```

**Rate Limit:**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

**Server Error:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong"
  }
}
```

---

## 🔒 Rate Limiting

### Global Limit

```
100 requests per 15 minutes per IP
```

### Webhook Limit

```
300 requests per 15 minutes per IP
```

**Response Headers:**

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1234567890
```

**429 Response:**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

---

## 🧪 Testing

### cURL Examples

**Health Check:**

```bash
curl -X GET https://your-domain.com/health
```

**Simulate Text Message:**

```bash
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: SIGNATURE" \
  -d '{
    "events": [{
      "type": "message",
      "replyToken": "test",
      "source": {"userId": "U123", "type": "user"},
      "timestamp": 1234567890123,
      "message": {
        "type": "text",
        "text": "กินข้าว 120"
      }
    }]
  }'
```

**Simulate Postback:**

```bash
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: SIGNATURE" \
  -d '{
    "events": [{
      "type": "postback",
      "replyToken": "test",
      "source": {"userId": "U123", "type": "user"},
      "timestamp": 1234567890123,
      "postback": {
        "data": "action=confirm_expense"
      }
    }]
  }'
```

### Postman Collection

**Import this JSON:**

```json
{
  "info": { "name": "Expense Bot API" },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Webhook - Text Message",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/webhook",
        "header": [{ "key": "X-Line-Signature", "value": "{{signature}}" }],
        "body": {
          "mode": "raw",
          "raw": "{ ... }"
        }
      }
    }
  ]
}
```

---

## 📚 External APIs Used

### LINE Messaging API

**Base URL:** `https://api.line.me/v2/bot`

**Endpoints Used:**

- `POST /message/reply` - Reply to messages
- `POST /message/push` - Send messages
- `GET /message/{messageId}/content` - Download images

### Google Gemini API

**Base URL:** `https://generativelanguage.googleapis.com/v1beta`

**Models Used:**

- `gemini-2.5-flash` - Text parsing
- `gemini-2.5-flash-vision` - OCR

---

## 🔗 Resources

- [LINE Messaging API Docs](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Webhook Events](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects)
- [Flex Message Spec](https://developers.line.biz/en/reference/messaging-api/#flex-message)

---

**Need Help?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
