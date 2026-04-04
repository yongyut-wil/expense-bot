# 🧪 Testing Guide

คู่มือการเขียน Tests สำหรับ Expense Bot - เหมาะสำหรับผู้เริ่มต้น

---

## 📚 สารบัญ

1. [ทำไมต้อง Test](#ทำไมต้อง-test)
2. [ตั้งค่า Testing Environment](#ตั้งค่า-testing-environment)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Mocking Dependencies](#mocking-dependencies)
6. [Test Coverage](#test-coverage)
7. [Best Practices](#best-practices)

---

## ทำไมต้อง Test

### ประโยชน์ของการเขียน Tests

- ✅ **Catch Bugs Early** - หาข้อผิดพลาดก่อนถึงมือ user
- ✅ **Refactor Safely** - แก้ไขโค้ดโดยไม่กลัวพัง
- ✅ **Documentation** - Test คือเอกสารที่ดีที่สุด
- ✅ **Confidence** - มั่นใจเวลา deploy

### Test Coverage Target

ตาม `jest.config.ts`:

- **Branches**: 70%
- **Functions**: 85%
- **Lines**: 90%
- **Statements**: 90%

**Current Coverage** (Application Code Only):

- ✅ Handlers: 100%
- ✅ Middleware: 100%
- ✅ Services: 100%
- ✅ Utils: 100%

**Note**: Excluded from coverage:

- `src/generated/**` - Prisma generated code
- `src/index.ts` - Entry point
- `src/app.ts` - Express app setup
- `src/db/**` - Database setup

---

## ตั้งค่า Testing Environment

### Dependencies ที่จำเป็น

```bash
npm install -D jest @types/jest ts-jest
npm install -D @jest/globals
```

### Jest Configuration

ไฟล์ `jest.config.ts` ถูกตั้งค่าแล้ว:

```typescript
{
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/__tests__/**",
    "!src/index.ts"
  ]
}
```

### โครงสร้าง Test Folder

```
src/__tests__/
├── __mocks__/              # Mock files
│   ├── line.ts            # LINE SDK mock
│   ├── google.ts          # Google AI mock
│   └── prisma.ts          # Prisma client mock
├── handlers/              # Handler tests
│   └── message.test.ts    # 15 tests
├── middleware/            # Middleware tests
│   ├── errorHandler.test.ts    # 9 tests
│   └── lineSignature.test.ts   # 7 tests
└── services/              # Service tests
    ├── expense.test.ts         # 12 tests
    ├── google.test.ts          # 9 tests
    ├── line.test.ts            # 13 tests
    ├── fallback.test.ts        # 18 tests
    └── parseExpense.test.ts    # 4 tests

Total: 8 test suites, 79 tests
```

---

## Unit Testing

### ตัวอย่างที่ 1: Test Fallback Parser

สร้างไฟล์ `src/__tests__/services/fallback.test.ts`:

```typescript
import { parseFallback } from "../../services/fallback";

describe("Fallback Parser", () => {
  describe("Expense Parsing", () => {
    it("should parse simple expense message", () => {
      const result = parseFallback("กินข้าว 120");

      expect(result.type).toBe("EXPENSE");
      expect(result.amount).toBe(120);
      expect(result.category).toBe("อาหาร");
      expect(result.description).toContain("กินข้าว");
    });

    it("should parse expense with category keyword", () => {
      const result = parseFallback("ค่ารถ BTS 50");

      expect(result.type).toBe("EXPENSE");
      expect(result.amount).toBe(50);
      expect(result.category).toBe("เดินทาง");
    });

    it("should handle amount with commas", () => {
      const result = parseFallback("ซื้อโทรศัพท์ 15,000");

      expect(result.amount).toBe(15000);
    });

    it("should handle decimal amounts", () => {
      const result = parseFallback("กาแฟ 45.50");

      expect(result.amount).toBe(45.5);
    });
  });

  describe("Income Parsing", () => {
    it("should detect income keywords", () => {
      const result = parseFallback("รับเงินเดือน 30000");

      expect(result.type).toBe("INCOME");
      expect(result.amount).toBe(30000);
      expect(result.category).toBe("เงินเดือน");
    });

    it("should detect 'ได้' as income", () => {
      const result = parseFallback("ได้โบนัส 5000");

      expect(result.type).toBe("INCOME");
      expect(result.amount).toBe(5000);
    });
  });

  describe("Edge Cases", () => {
    it("should return UNKNOWN for invalid input", () => {
      const result = parseFallback("สวัสดี");

      expect(result.type).toBe("UNKNOWN");
      expect(result.amount).toBeNull();
    });

    it("should handle empty string", () => {
      const result = parseFallback("");

      expect(result.type).toBe("UNKNOWN");
    });

    it("should default to อื่นๆ for unknown category", () => {
      const result = parseFallback("ซื้อของ 100");

      expect(result.category).toBe("อื่นๆ");
    });
  });
});
```

### ตัวอย่างที่ 2: Test Custom Errors

สร้างไฟล์ `src/__tests__/utils/errors.test.ts`:

```typescript
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ExternalServiceError,
} from "../../utils/errors";

describe("Custom Error Classes", () => {
  describe("AppError", () => {
    it("should create error with default values", () => {
      const error = new AppError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.isOperational).toBe(true);
    });

    it("should create error with custom values", () => {
      const error = new AppError("Custom", 503, "CUSTOM_CODE", false);

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("CUSTOM_CODE");
      expect(error.isOperational).toBe(false);
    });

    it("should have stack trace", () => {
      const error = new AppError("Test");

      expect(error.stack).toBeDefined();
    });
  });

  describe("ValidationError", () => {
    it("should have 400 status code", () => {
      const error = new ValidationError("Invalid input");

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("UnauthorizedError", () => {
    it("should have 401 status code", () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Unauthorized");
    });

    it("should accept custom message", () => {
      const error = new UnauthorizedError("Invalid token");

      expect(error.message).toBe("Invalid token");
    });
  });

  describe("NotFoundError", () => {
    it("should have 404 status code", () => {
      const error = new NotFoundError("User not found");

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });
  });

  describe("ExternalServiceError", () => {
    it("should have 502 status code", () => {
      const error = new ExternalServiceError("AI service failed");

      expect(error.statusCode).toBe(502);
      expect(error.code).toBe("EXTERNAL_SERVICE_ERROR");
    });
  });
});
```

### รัน Unit Tests

```bash
# รัน all tests
npm test

# รัน specific file
npm test fallback.test.ts

# รัน in watch mode
npm test -- --watch

# รัน with coverage
npm test -- --coverage
```

---

## Integration Testing

### ตัวอย่างที่ 3: Test Expense Service with Database

สร้างไฟล์ `src/__tests__/services/expense.test.ts`:

```typescript
import { PrismaClient } from "../../generated/prisma";
import {
  getOrCreateUser,
  saveExpense,
  getMonthlySummary,
  getRecentExpenses,
} from "../../services/expense";

const prisma = new PrismaClient();

describe("Expense Service", () => {
  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.expense.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.expense.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("getOrCreateUser", () => {
    it("should create new user", async () => {
      const user = await getOrCreateUser("LINE_USER_123");

      expect(user.lineUserId).toBe("LINE_USER_123");
      expect(user.id).toBeDefined();
    });

    it("should return existing user", async () => {
      const user1 = await getOrCreateUser("LINE_USER_123");
      const user2 = await getOrCreateUser("LINE_USER_123");

      expect(user1.id).toBe(user2.id);
    });

    it("should create multiple different users", async () => {
      const user1 = await getOrCreateUser("USER_1");
      const user2 = await getOrCreateUser("USER_2");

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe("saveExpense", () => {
    it("should save expense successfully", async () => {
      const expense = await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 150,
        description: "กินข้าว",
        category: "อาหาร",
      });

      expect(expense.amount).toBe(150);
      expect(expense.description).toBe("กินข้าว");
      expect(expense.type).toBe("EXPENSE");
    });

    it("should save income successfully", async () => {
      const income = await saveExpense("LINE_USER_123", {
        type: "INCOME",
        amount: 30000,
        description: "เงินเดือน",
        category: "เงินเดือน",
      });

      expect(income.type).toBe("INCOME");
      expect(income.amount).toBe(30000);
    });

    it("should create category if not exists", async () => {
      await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 100,
        description: "Test",
        category: "ใหม่",
      });

      const categories = await prisma.category.findMany();
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("ใหม่");
    });

    it("should reuse existing category", async () => {
      await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 100,
        description: "อาหาร 1",
        category: "อาหาร",
      });

      await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 200,
        description: "อาหาร 2",
        category: "อาหาร",
      });

      const categories = await prisma.category.findMany();
      expect(categories).toHaveLength(1);
    });
  });

  describe("getMonthlySummary", () => {
    it("should return summary with income and expense", async () => {
      await saveExpense("LINE_USER_123", {
        type: "INCOME",
        amount: 30000,
        description: "เงินเดือน",
        category: "เงินเดือน",
      });

      await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 5000,
        description: "ค่าเช่า",
        category: "ที่พัก",
      });

      const summary = await getMonthlySummary("LINE_USER_123");

      expect(summary.totalIncome).toBe(30000);
      expect(summary.totalExpense).toBe(5000);
      expect(summary.balance).toBe(25000);
    });

    it("should group by category", async () => {
      await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 100,
        description: "อาหาร 1",
        category: "อาหาร",
      });

      await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 200,
        description: "อาหาร 2",
        category: "อาหาร",
      });

      const summary = await getMonthlySummary("LINE_USER_123");
      const foodCategory = summary.byCategory.find(
        (c) => c.category === "อาหาร"
      );

      expect(foodCategory?.total).toBe(300);
      expect(foodCategory?.count).toBe(2);
    });

    it("should return empty summary for new user", async () => {
      const summary = await getMonthlySummary("NEW_USER");

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(0);
      expect(summary.balance).toBe(0);
      expect(summary.byCategory).toHaveLength(0);
    });
  });

  describe("getRecentExpenses", () => {
    it("should return recent expenses", async () => {
      await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 100,
        description: "Test 1",
        category: "อื่นๆ",
      });

      await saveExpense("LINE_USER_123", {
        type: "EXPENSE",
        amount: 200,
        description: "Test 2",
        category: "อื่นๆ",
      });

      const recent = await getRecentExpenses("LINE_USER_123");

      expect(recent).toHaveLength(2);
      expect(recent[0].description).toBe("Test 2"); // Most recent first
    });

    it("should limit to specified number", async () => {
      for (let i = 0; i < 15; i++) {
        await saveExpense("LINE_USER_123", {
          type: "EXPENSE",
          amount: 100,
          description: `Test ${i}`,
          category: "อื่นๆ",
        });
      }

      const recent = await getRecentExpenses("LINE_USER_123", 10);

      expect(recent).toHaveLength(10);
    });
  });
});
```

---

## Mocking Dependencies

### Mock LINE SDK

สร้างไฟล์ `src/__tests__/__mocks__/line.ts`:

```typescript
export const Client = jest.fn().mockImplementation(() => ({
  replyMessage: jest.fn().mockResolvedValue({}),
  pushMessage: jest.fn().mockResolvedValue({}),
}));

export const validateSignature = jest.fn().mockReturnValue(true);
```

### Mock Google AI

สร้างไฟล์ `src/__tests__/__mocks__/google.ts`:

```typescript
export const GoogleGenerativeAI = jest.fn().mockImplementation(() => ({
  getGenerativeModel: jest.fn().mockReturnValue({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            type: "EXPENSE",
            amount: 100,
            description: "Test",
            category: "อื่นๆ",
          }),
      },
    }),
  }),
}));
```

### ตัวอย่างการใช้ Mocks

สร้างไฟล์ `src/__tests__/services/google.test.ts`:

```typescript
import { GoogleProvider } from "../../services/google";

jest.mock("@google/generative-ai");

describe("Google AI Provider", () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    provider = new GoogleProvider("test-api-key");
  });

  it("should parse expense message", async () => {
    const result = await provider.parseExpense("กินข้าว 120");

    expect(result.type).toBe("EXPENSE");
    expect(result.amount).toBe(100);
  });

  it("should handle AI errors gracefully", async () => {
    // Mock AI to throw error
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockRejectedValue(new Error("API Error")),
      }),
    }));

    const provider = new GoogleProvider("test-api-key");
    const result = await provider.parseExpense("Test");

    expect(result.type).toBe("UNKNOWN");
  });
});
```

---

## Test Coverage

### ดู Coverage Report

```bash
npm test -- --coverage
```

Output:

```
------------------------|---------|----------|---------|---------|
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
All files               |   85.23 |    78.45 |   88.12 |   86.34 |
 handlers               |   90.12 |    85.67 |   92.45 |   91.23 |
  message.ts            |   90.12 |    85.67 |   92.45 |   91.23 |
 services               |   82.34 |    75.23 |   85.67 |   83.45 |
  expense.ts            |   88.45 |    82.34 |   90.12 |   89.23 |
  fallback.ts           |   95.67 |    92.45 |   98.23 |   96.12 |
  google.ts             |   75.23 |    68.45 |   78.12 |   76.34 |
------------------------|---------|----------|---------|---------|
```

### เพิ่ม Coverage

```bash
# Generate HTML report
npm test -- --coverage --coverageReporters=html

# Open in browser
open coverage/index.html
```

---

## Best Practices

### 1. Test Naming Convention

```typescript
describe("Component/Function Name", () => {
  describe("Feature/Method", () => {
    it("should do something specific", () => {
      // Test
    });
  });
});
```

### 2. AAA Pattern

```typescript
it("should save expense", async () => {
  // Arrange - เตรียมข้อมูล
  const input = { type: "EXPENSE", amount: 100 };

  // Act - เรียกใช้ฟังก์ชัน
  const result = await saveExpense("USER_123", input);

  // Assert - ตรวจสอบผลลัพธ์
  expect(result.amount).toBe(100);
});
```

### 3. Test Independence

```typescript
// ❌ Bad - Tests depend on each other
it("should create user", () => {
  /* ... */
});
it("should update user", () => {
  /* assumes user exists */
});

// ✅ Good - Each test is independent
beforeEach(async () => {
  await createTestUser();
});

it("should update user", () => {
  /* ... */
});
```

### 4. Use Test Database

```env
# .env.test
DATABASE_URL=postgresql://postgres:password@localhost:5432/expensebot_test
```

### 5. Mock External Services

```typescript
// ❌ Bad - Calls real API
it("should call LINE API", async () => {
  await lineClient.replyMessage(token, message);
});

// ✅ Good - Uses mock
jest.mock("@line/bot-sdk");

it("should call LINE API", async () => {
  await lineClient.replyMessage(token, message);
  expect(lineClient.replyMessage).toHaveBeenCalled();
});
```

### 6. Test Edge Cases

```typescript
describe("parseFallback", () => {
  it("should handle empty string", () => {
    /* ... */
  });
  it("should handle null", () => {
    /* ... */
  });
  it("should handle very large numbers", () => {
    /* ... */
  });
  it("should handle special characters", () => {
    /* ... */
  });
  it("should handle Thai and English mixed", () => {
    /* ... */
  });
});
```

### 7. Use Descriptive Assertions

```typescript
// ❌ Bad
expect(result).toBe(true);

// ✅ Good
expect(result.type).toBe("EXPENSE");
expect(result.amount).toBeGreaterThan(0);
expect(result.description).toContain("กินข้าว");
```

### 8. Clean Up After Tests

```typescript
afterEach(async () => {
  await prisma.expense.deleteMany();
  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

---

## Test Checklist

เมื่อเขียน feature ใหม่ ให้ตรวจสอบ:

- [ ] Unit tests สำหรับ business logic
- [ ] Integration tests สำหรับ database operations
- [ ] Mock external dependencies (LINE, AI, etc.)
- [ ] Test happy path และ error cases
- [ ] Test edge cases (empty, null, invalid input)
- [ ] Coverage ≥ 80%
- [ ] Tests run successfully ใน CI/CD

---

## เพิ่มเติม

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test -- --coverage
```

### Watch Mode

```bash
# รัน tests ที่เปลี่ยนแปลง
npm test -- --watch

# รัน tests related to changed files
npm test -- --onlyChanged
```

### Debug Tests

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

---

🎉 **ยินดีด้วย! คุณพร้อมเขียน tests แล้ว**

Remember: **Good tests = Good code = Happy developers**
