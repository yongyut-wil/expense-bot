# 🎨 Flex Message Design System

คู่มือการออกแบบและปรับแต่ง LINE Flex Messages สำหรับ Expense Bot

## 📋 Overview

Expense Bot ใช้ LINE Flex Message สำหรับแสดงข้อมูลการยืนยันรายรับ-รายจ่ายแบบ interactive พร้อม UI สวยงามและใช้งานง่าย

## 🎨 Design Principles

### 1. Visual Hierarchy

- **Header** - ชัดเจน บอกประเภท action
- **Amount** - ใหญ่ เด่น เป็นจุดสนใจหลัก
- **Details** - รองลงมา อ่านง่าย
- **Actions** - ชัดเจน แยกจากกัน

### 2. Color Psychology

- **เขียว** - รายรับ, positive, ยืนยัน
- **แดง** - รายจ่าย, warning, ยกเลิก
- **เทา** - neutral, labels
- **ฟ้า** - information, categories

### 3. Accessibility

- **Contrast ratio** - ข้อความอ่านง่าย
- **Touch targets** - ปุ่มใหญ่พอ (LINE auto-handle)
- **Visual feedback** - สีแยกชัดเจน

## 🎨 Color Palette

### Primary Colors

```typescript
// Expense (รายจ่าย)
const EXPENSE_HEADER = "#8B4049"; // แดงเข้ม - header
const EXPENSE_AMOUNT = "#E85D75"; // แดงสด - amount
const EXPENSE_BADGE = "#F8D7DA"; // ชมพูจาง - type badge

// Income (รายรับ)
const INCOME_HEADER = "#4A7C59"; // เขียวเข้ม - header
const INCOME_AMOUNT = "#4A7C59"; // เขียว - amount
const INCOME_BADGE = "#D4EDDA"; // เขียวจาง - type badge
```

### Secondary Colors

```typescript
// UI Elements
const CATEGORY_BADGE = "#D6E9F8"; // ฟ้าจาง - category badge
const CONFIRM_BTN = "#22A699"; // เขียวมิ้นท์ - confirm button
const DESC_BG = "#F5F5F5"; // เทาอ่อน - description box
const OCR_INFO_BG = "#FAFAFA"; // เทาอ่อนมาก - OCR info

// Text Colors
const PRIMARY_TEXT = "#333333"; // ดำเข้ม
const LABEL_TEXT = "#999999"; // เทา
const SECONDARY_TEXT = "#666666"; // เทากลาง
```

### Confidence Colors (OCR)

```typescript
const CONFIDENCE_HIGH = "#22A699"; // เขียว
const CONFIDENCE_MEDIUM = "#F39C12"; // ส้ม
const CONFIDENCE_LOW = "#E85D75"; // แดง
```

## 📐 Layout Structure

### Text Expense Confirmation

```
┌─────────────────────────────────┐
│ ยืนยันการบันทึก            🗑️ │ ← Header (colored)
├─────────────────────────────────┤
│ TYPE           CATEGORY         │
│ ┌────────┐    ┌──────────────┐  │
│ │💸 รายจ่าย│    │🏷️ อาหาร     │  │ ← Badges
│ └────────┘    └──────────────┘  │
│                                 │
│      TOTAL AMOUNT               │
│        500 บาท                  │ ← Large centered amount
│                                 │
│ ┌─────────────────────────────┐ │
│ │ DESCRIPTION                 │ │
│ │ กินข้าว                     │ │ ← Description box
│ └─────────────────────────────┘ │
│                                 │
│ ┌───────────────────────────── ┐│
│ │     ✓ ยืนยัน                 ││ ← Confirm button
│ └─────────────────────────────┘ │
│ ┌───────────────────────────── ┐│
│ │     ✕ ยกเลิก                 ││ ← Cancel button
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### OCR Confirmation (with extra fields)

```
┌─────────────────────────────────┐
│ 📸 ตรวจสอบสลิป            🗑️   │ ← Header
├─────────────────────────────────┤
│ TYPE           CATEGORY         │
│ ┌────────┐    ┌──────────────┐  │
│ │💸 รายจ่าย│    │🏷️ อาหาร     │  │ ← Badges
│ └────────┘    └──────────────┘  │
│                                 │
│      TOTAL AMOUNT               │
│        120 บาท                  │ ← Amount
│                                 │
│ ┌─────────────────────────────┐ │
│ │ DESCRIPTION                 │ │
│ │ ค่าอาหาร                    │ │ ← Description box
│ └─────────────────────────────┘ │
│                                 │
│ 🏪 ร้านอาหาร ABC               │ ← Optional: merchant
│ 📅 25/03/2026                   │ ← Optional: date
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ความแม่นยำ OCR    ✓ สูง    │ │ ← Confidence
│ └─────────────────────────────┘ │
│                                 │
│ [Buttons same as text]          │
└─────────────────────────────────┘
```

## 🔧 Component Specifications

### Header

```typescript
{
  type: "box",
  layout: "horizontal",
  backgroundColor: headerColor,  // #8B4049 or #4A7C59
  paddingAll: "lg",
  contents: [
    { text: "ยืนยันการบันทึก", color: "#ffffff", weight: "bold", size: "md" },
    { text: "🗑️", size: "md", align: "end" }
  ]
}
```

**Properties:**

- `backgroundColor`: Dynamic (expense/income)
- `paddingAll`: "lg"
- `layout`: "horizontal"
- Delete icon (🗑️) - decorative only

### Badge Components

**Type Badge:**

```typescript
{
  type: "box",
  layout: "horizontal",
  backgroundColor: typeBadgeColor,  // #F8D7DA or #D4EDDA
  cornerRadius: "md",
  paddingAll: "sm",
  contents: [
    { text: "💸 รายจ่าย", color: headerColor, weight: "bold", align: "center" }
  ]
}
```

**Category Badge:**

```typescript
{
  type: "box",
  layout: "horizontal",
  backgroundColor: "#D6E9F8",
  cornerRadius: "md",
  paddingAll: "sm",
  contents: [
    { text: "🏷️ อาหาร", color: "#1E5A8E", weight: "bold", align: "center" }
  ]
}
```

### Amount Display

```typescript
{
  type: "box",
  layout: "baseline",
  spacing: "xs",
  contents: [
    {
      text: amount.toLocaleString(),
      size: "4xl",           // ใหญ่มาก!
      weight: "bold",
      color: amountColor,
      align: "center",
      flex: 0
    },
    {
      text: "บาท",
      size: "md",
      color: amountColor,
      flex: 0,
      margin: "sm"
    }
  ]
}
```

**Key points:**

- `size: "4xl"` - ขนาดใหญ่สุด
- `layout: "baseline"` - จัดข้อความแนวเดียวกัน
- `flex: 0` - ไม่ยืด auto-size

### Description Box

```typescript
{
  type: "box",
  layout: "vertical",
  backgroundColor: "#F5F5F5",
  cornerRadius: "md",
  paddingAll: "md",
  contents: [
    { text: "DESCRIPTION", color: "#999999", size: "xs" },
    { text: description, color: "#333333", weight: "bold", wrap: true }
  ]
}
```

**Properties:**

- `backgroundColor`: "#F5F5F5" (light gray)
- `cornerRadius`: "md" (rounded corners)
- `wrap: true` - ข้อความยาวขึ้นบรรทัดใหม่

### Buttons

**Confirm Button:**

```typescript
{
  type: "button",
  style: "primary",
  color: "#22A699",      // เขียวมิ้นท์
  height: "sm",
  action: {
    type: "postback",
    label: "✓ ยืนยัน",
    data: "action=confirm_expense"
  }
}
```

**Cancel Button:**

```typescript
{
  type: "button",
  style: "link",         // แบบ link (ไม่มีสี)
  height: "sm",
  action: {
    type: "postback",
    label: "✕ ยกเลิก",
    data: "action=cancel_expense"
  }
}
```

## 📱 Implementation

### Text Expense Message

Location: `src/services/line.ts` → `sendExpenseConfirmMessage()`

```typescript
export async function sendExpenseConfirmMessage(
  userId: string,
  expense: {
    type: string;
    amount: number;
    description: string;
    category: string;
  }
): Promise<void> {
  const isIncome = expense.type === "INCOME";
  const headerColor = isIncome ? "#4A7C59" : "#8B4049";
  const amountColor = isIncome ? "#4A7C59" : "#E85D75";
  const typeBadgeColor = isIncome ? "#D4EDDA" : "#F8D7DA";

  const flexMessage = {
    type: "flex" as const,
    altText: `ยืนยันการบันทึก ${expense.amount.toLocaleString()} บาท?`,
    contents: {
      type: "bubble" as const,
      header: {
        /* ... */
      },
      body: {
        /* ... */
      },
      footer: {
        /* ... */
      },
    },
  };

  await lineClient.pushMessage(userId, flexMessage);
}
```

### OCR Confirmation Message

Location: `src/services/line.ts` → `sendOcrConfirmMessage()`

**Extra Features:**

- Dynamic body contents (merchant, date ถ้ามี)
- Confidence indicator
- Same layout as text expense

```typescript
const bodyContents: any[] = [
  /* badges, amount, description */
];

// Conditional fields
if (ocr.merchant || ocr.date) {
  bodyContents.push(/* merchant/date */);
}

// Confidence indicator
bodyContents.push({
  /* OCR confidence badge */
});
```

## 🎨 Customization Guide

### เปลี่ยนสี

**1. Header Color:**

```typescript
// src/services/line.ts
const headerColor = isIncome ? "#YOUR_COLOR" : "#YOUR_COLOR";
```

**2. Amount Color:**

```typescript
const amountColor = isIncome ? "#YOUR_COLOR" : "#YOUR_COLOR";
```

**3. Badge Colors:**

```typescript
const typeBadgeColor = isIncome ? "#LIGHT_GREEN" : "#LIGHT_RED";
const categoryBadgeColor = "#LIGHT_BLUE";
```

### เปลี่ยนขนาดข้อความ

LINE Flex Message Text Sizes:

- `"xxs"` - เล็กสุด
- `"xs"` - เล็กมาก
- `"sm"` - เล็ก
- `"md"` - กลาง (default)
- `"lg"` - ใหญ่
- `"xl"` - ใหญ่มาก
- `"xxl"` - ใหญ่มากๆ
- `"3xl"` - ใหญ่สุด -1
- `"4xl"` - ใหญ่สุด ⭐

### เพิ่มฟิลด์ใหม่

**Example: เพิ่มช่อง "Note"**

```typescript
// ใน bodyContents array
bodyContents.push({
  type: "box" as const,
  layout: "vertical" as const,
  spacing: "sm" as const,
  margin: "md" as const,
  backgroundColor: "#F5F5F5",
  cornerRadius: "md" as const,
  paddingAll: "md" as const,
  contents: [
    {
      type: "text" as const,
      text: "NOTE",
      color: "#999999",
      size: "xs" as const,
    },
    {
      type: "text" as const,
      text: expense.note || "-",
      size: "sm" as const,
      color: "#333333",
      wrap: true,
    },
  ],
});
```

### เปลี่ยน Icon

**Available Emoji Icons:**

- 💸 💰 - expense/income
- 🏷️ - category
- 🏪 - merchant
- 📅 - date
- ✓ ✕ - confirm/cancel
- 🗑️ - delete
- 📸 - OCR/photo
- ⚠️ - warning
- ✅ ❌ - success/error

## 🧪 Testing Flex Messages

### LINE Flex Message Simulator

1. ไปที่ [Flex Message Simulator](https://developers.line.biz/flex-simulator/)
2. Paste JSON code
3. Preview on mobile

**ตัวอย่าง JSON:**

```json
{
  "type": "bubble",
  "header": { ... },
  "body": { ... },
  "footer": { ... }
}
```

### การ Debug

**เช็ค Flex Message Errors:**

```typescript
// src/services/line.ts
catch (err) {
  const errorResponse = (err as any)?.response;
  console.error("Flex Message Error:", {
    status: errorResponse?.status,
    data: errorResponse?.data,
    payload: JSON.stringify(flexMessage)
  });
}
```

**Common Errors:**

- ❌ Invalid property (เช่น `margin` ใน `separator`)
- ❌ Invalid enum value (เช่น `style: "secondary"` ใน button)
- ❌ Missing required field
- ❌ Text too long

## 📏 Best Practices

### 1. Performance

- ✅ Keep JSON size < 50KB
- ✅ Optimize image URLs (ถ้ามี)
- ✅ Reuse colors (ประกาศ constants)

### 2. Accessibility

- ✅ Contrast ratio ≥ 4.5:1 (text vs background)
- ✅ Font size ≥ `sm` สำหรับข้อความสำคัญ
- ✅ Touch target ≥ 44x44 (LINE auto-handle buttons)

### 3. Consistency

- ✅ ใช้สีเดียวกันสำหรับ action เดียวกัน
- ✅ Layout เหมือนกันทุก message type
- ✅ Naming convention ชัดเจน

### 4. Mobile-First

- ✅ Test บน mobile จริง
- ✅ Text wrap properly
- ✅ Spacing เหมาะสม (ไม่แน่นเกิน)

## 🔗 Resources

- [LINE Flex Message Docs](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/)
- [Flex Message Simulator](https://developers.line.biz/flex-simulator/)
- [Flex Message Components](https://developers.line.biz/en/reference/messaging-api/#component)
- [Color Palette Generator](https://coolors.co/)

## 💡 Design Tips

### 1. ใช้ Hierarchy

```
Header (bold, large) → Amount (huge!) → Details (normal) → Actions (clear)
```

### 2. Group Related Info

```
[Type Badge] [Category Badge]  ← grouped horizontally
        ↓
   [Amount]                    ← centered, emphasized
        ↓
[Description Box]              ← grouped with background
```

### 3. Color Coding

- **เขียว** = positive, success, income
- **แดง** = negative, expense
- **ฟ้า** = neutral, info
- **เทา** = labels

### 4. Visual Balance

```
Header (full width, colored)
Body   (padded, white background)
Footer (buttons, full width)
```

---

**Happy Designing! 🎨**

อ่านเพิ่มเติม: [USER_GUIDE.md](./USER_GUIDE.md) | [API_REFERENCE.md](./API_REFERENCE.md)
