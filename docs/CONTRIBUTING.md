# 🤝 Contributing Guide

คู่มือสำหรับการพัฒนาและมีส่วนร่วมในโปรเจ็ค Expense Bot

---

## 📚 สารบัญ

1. [Development Workflow](#development-workflow)
2. [Git Workflow](#git-workflow)
3. [Code Style](#code-style)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Code Review Checklist](#code-review-checklist)
7. [Development Tools](#development-tools)

---

## Development Workflow

### การตั้งค่า Development Environment

```bash
# 1. Clone repository
git clone https://github.com/your-username/expense-bot.git
cd expense-bot

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. ตั้งค่า environment variables
# แก้ไขไฟล์ .env ให้ครบ

# 5. Setup database
createdb expensebot
npx prisma migrate dev

# 6. Run development server
npm run dev
```

### Development Scripts

```bash
# Development
npm run dev              # รัน server ด้วย nodemon (hot reload)

# Build
npm run build            # Compile TypeScript to JavaScript
npm start                # รัน production build

# Database
npm run db:migrate       # รัน database migrations
npm run db:generate      # Generate Prisma client
npm run db:studio        # เปิด Prisma Studio
npm run db:seed          # Seed database (ถ้ามี)

# Testing
npm test                 # รัน tests
npm run test:watch       # รัน tests in watch mode
npm run test:coverage    # รัน tests with coverage

# Code Quality
npm run lint             # รัน ESLint
npm run format           # Format code ด้วย Prettier
npm run type-check       # TypeScript type checking
```

---

## Git Workflow

### Branch Strategy

```
main (production)
  ├── develop (staging)
  │   ├── feature/add-rich-menu
  │   ├── feature/analytics-dashboard
  │   ├── bugfix/signature-validation
  │   └── hotfix/critical-db-issue
```

### Branch Naming Convention

```bash
# Feature branches
feature/short-description
feature/add-export-csv
feature/multi-language-support

# Bug fixes
bugfix/short-description
bugfix/fix-date-parsing
bugfix/memory-leak

# Hotfixes (urgent production fixes)
hotfix/critical-issue
hotfix/security-patch

# Refactoring
refactor/service-layer
refactor/error-handling

# Documentation
docs/update-readme
docs/add-api-docs
```

### การสร้าง Branch

```bash
# สร้าง branch ใหม่จาก develop
git checkout develop
git pull origin develop
git checkout -b feature/add-rich-menu

# หรือใช้คำสั่งเดียว
git checkout -b feature/add-rich-menu develop
```

### การอัพเดท Branch

```bash
# อัพเดท branch จาก develop เป็นประจำ
git checkout develop
git pull origin develop
git checkout feature/add-rich-menu
git merge develop

# หรือใช้ rebase (recommended)
git rebase develop
```

---

## Code Style

### TypeScript Style Guide

#### 1. Type Annotations

```typescript
// ✅ Good - Explicit return types
export async function saveExpense(
  lineUserId: string,
  parsed: ParsedExpense
): Promise<Expense> {
  // ...
}

// ❌ Bad - No return type
export async function saveExpense(lineUserId, parsed) {
  // ...
}
```

#### 2. Interface vs Type

```typescript
// ✅ Good - Use interface for object shapes
interface ParsedExpense {
  type: "INCOME" | "EXPENSE" | "UNKNOWN";
  amount: number | null;
  description: string;
  category: string;
}

// ✅ Good - Use type for unions and primitives
type ExpenseType = "INCOME" | "EXPENSE";
type UserId = string;
```

#### 3. Async/Await

```typescript
// ✅ Good - Use async/await
async function processMessage(text: string): Promise<void> {
  try {
    const parsed = await aiProvider.parseExpense(text);
    await saveExpense(userId, parsed);
  } catch (error) {
    logger.error("Failed to process", { error });
  }
}

// ❌ Bad - Promise chains
function processMessage(text: string) {
  return aiProvider
    .parseExpense(text)
    .then((parsed) => saveExpense(userId, parsed))
    .catch((error) => logger.error(error));
}
```

#### 4. Error Handling

```typescript
// ✅ Good - Use custom errors
if (!signature) {
  throw new UnauthorizedError("Missing LINE signature");
}

// ❌ Bad - Generic errors
if (!signature) {
  throw new Error("Missing signature");
}
```

#### 5. Function Length

```typescript
// ✅ Good - Short, focused functions
async function processMessage(event: MessageEvent): Promise<void> {
  const { userId, text, replyToken } = extractEventData(event);

  if (isCommand(text)) {
    return handleCommand(userId, text, replyToken);
  }

  return handleExpenseMessage(userId, text, replyToken);
}

// ❌ Bad - Long function doing everything
async function processMessage(event: MessageEvent): Promise<void> {
  // 200+ lines of code
}
```

#### 6. Naming Conventions

```typescript
// Variables & Functions - camelCase
const totalExpense = 100;
function calculateBalance() {}

// Classes - PascalCase
class GoogleProvider {}
class ExpenseService {}

// Interfaces - PascalCase
interface ParsedExpense {}

// Enums - PascalCase
enum ExpenseType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_LIMIT = 10;

// Private properties - prefix with _
class Service {
  private _client: Client;
}
```

#### 7. Import Organization

```typescript
// 1. Node built-ins
import crypto from "crypto";

// 2. External packages
import express from "express";
import { z } from "zod";

// 3. Internal modules
import { config } from "./config";
import { logger } from "./utils/logger";
import { prisma } from "./db/prisma";

// 4. Types
import type { ParsedExpense } from "./types";
```

### ESLint Configuration

สร้างไฟล์ `.eslintrc.json`:

```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

### Prettier Configuration

สร้างไฟล์ `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: Feature ใหม่
- **fix**: Bug fix
- **docs**: เปลี่ยนแปลงเอกสาร
- **style**: Code formatting (ไม่เปลี่ยนความหมาย)
- **refactor**: Code refactoring
- **test**: เพิ่มหรือแก้ไข tests
- **chore**: เปลี่ยนแปลง build process หรือ tools

### Scope (ตัวเลือก)

- **api**: API endpoints
- **db**: Database
- **ai**: AI services
- **line**: LINE integration
- **config**: Configuration

### ตัวอย่าง Commit Messages

```bash
# Feature
feat(ai): add support for OpenAI provider

# Bug fix
fix(line): correct signature validation logic

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(services): extract expense service methods

# Test
test(handlers): add tests for message handler

# Multiple lines
feat(api): add expense export endpoint

- Add CSV export functionality
- Add date range filtering
- Update API documentation

Closes #123
```

### Commit Best Practices

```bash
# ✅ Good - Atomic commits
git commit -m "feat(ai): add OpenAI provider"
git commit -m "test(ai): add OpenAI provider tests"
git commit -m "docs(ai): update AI provider documentation"

# ❌ Bad - Big bang commit
git commit -m "add OpenAI, tests, and docs"
```

### Amending Commits

```bash
# แก้ไข commit ล่าสุด
git commit --amend

# เปลี่ยน commit message
git commit --amend -m "fix(line): correct signature validation"

# เพิ่มไฟล์ใน commit ล่าสุด
git add forgotten-file.ts
git commit --amend --no-edit
```

---

## Pull Request Process

### 1. เตรียม PR

```bash
# 1. ตรวจสอบว่าอยู่ใน branch ที่ถูกต้อง
git branch

# 2. อัพเดทจาก develop
git checkout develop
git pull origin develop
git checkout feature/add-rich-menu
git rebase develop

# 3. รัน tests
npm test

# 4. รัน linting
npm run lint

# 5. Type check
npm run type-check

# 6. Build
npm run build

# 7. Push
git push origin feature/add-rich-menu
```

### 2. สร้าง Pull Request

**PR Title Format:**

```
[Type] Short description
```

**ตัวอย่าง:**

```
[Feature] Add LINE Rich Menu support
[Bug Fix] Fix signature validation timing attack
[Refactor] Extract expense service layer
```

**PR Description Template:**

```markdown
## Description

อธิบายการเปลี่ยนแปลงโดยสรุป

## Changes

- เพิ่ม Rich Menu configuration
- อัพเดท LINE SDK version
- เพิ่ม unit tests

## Type of Change

- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [x] Unit tests passed
- [x] Integration tests passed
- [x] Manual testing completed

## Screenshots (ถ้ามี)

![Rich Menu](./screenshots/rich-menu.png)

## Related Issues

Closes #123
Related to #456

## Checklist

- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for complex logic
- [x] Documentation updated
- [x] No new warnings
- [x] Tests added
- [x] All tests pass
```

### 3. รอ Code Review

- ✅ ตอบกลับ comments อย่างสร้างสรรค์
- ✅ แก้ไขตาม feedback
- ✅ Push updates เป็น commits ใหม่
- ✅ Request re-review เมื่อแก้ไขเสร็จ

### 4. Merge

```bash
# Squash merge (recommended)
# รวม commits เป็น commit เดียวเพื่อความสะอาด

# Rebase merge
# เก็บ commit history ทั้งหมด

# Merge commit
# สร้าง merge commit
```

---

## Code Review Checklist

### สำหรับ Author (ผู้สร้าง PR)

#### ก่อน Submit PR

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code formatted with Prettier
- [ ] Self-review completed
- [ ] Complex logic has comments
- [ ] Documentation updated

#### Functionality

- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] No hardcoded values
- [ ] Environment variables used correctly

#### Testing

- [ ] Unit tests added
- [ ] Integration tests added (if needed)
- [ ] Test coverage ≥ 80%
- [ ] Tests are meaningful
- [ ] Mock external dependencies

#### Security

- [ ] No sensitive data in code
- [ ] Input validation implemented
- [ ] SQL injection prevented (Prisma helps)
- [ ] XSS prevented
- [ ] Authentication/Authorization checked

### สำหรับ Reviewer

#### Code Quality

- [ ] Code is readable and maintainable
- [ ] Follows project conventions
- [ ] No code duplication
- [ ] Functions are focused (single responsibility)
- [ ] Naming is clear and descriptive

#### Architecture

- [ ] Follows existing patterns
- [ ] Proper separation of concerns
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Proper error handling

#### Testing

- [ ] Tests are comprehensive
- [ ] Tests are independent
- [ ] Edge cases covered
- [ ] Mocks used appropriately

#### Performance

- [ ] No performance regressions
- [ ] Database queries efficient
- [ ] No memory leaks
- [ ] Async operations handled properly

### Review Comments Examples

```typescript
// ✅ Good - Constructive feedback
// Consider extracting this into a separate function for better testability
function processMessage() {
  // 50 lines of code
}

// ✅ Good - Suggestion with example
// Consider using optional chaining here:
const category = parsed?.category ?? "อื่นๆ";

// ✅ Good - Question
// Why do we need to check this twice?

// ❌ Bad - Not specific
// This is bad

// ❌ Bad - Not constructive
// You should know better
```

---

## Development Tools

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest",
    "eamodio.gitlens"
  ]
}
```

### VS Code Settings

สร้างไฟล์ `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "node_modules": true,
    "dist": true
  }
}
```

### Git Hooks with Husky

```bash
# ติดตั้ง
npm install -D husky lint-staged

# Setup
npx husky install
```

สร้างไฟล์ `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm test
```

สร้างไฟล์ `.lintstagedrc.json`:

```json
{
  "*.ts": ["eslint --fix", "prettier --write", "git add"],
  "*.{json,md}": ["prettier --write", "git add"]
}
```

### Debug Configuration

สร้างไฟล์ `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Environment-Specific Guidelines

### Development

```env
NODE_ENV=development
LOG_LEVEL=debug

# ใช้ test credentials
LINE_CHANNEL_SECRET=test_secret
GOOGLE_API_KEY=test_key

# ใช้ local database
DATABASE_URL=postgresql://postgres:password@localhost:5432/expensebot_dev
```

### Staging

```env
NODE_ENV=staging
LOG_LEVEL=info

# ใช้ staging credentials
LINE_CHANNEL_SECRET=staging_secret
GOOGLE_API_KEY=staging_key

# ใช้ staging database
DATABASE_URL=postgresql://user:pass@staging-db:5432/expensebot_staging
```

### Production

```env
NODE_ENV=production
LOG_LEVEL=warn

# ใช้ production credentials
LINE_CHANNEL_SECRET=prod_secret
GOOGLE_API_KEY=prod_key

# ใช้ production database
DATABASE_URL=postgresql://user:pass@prod-db:5432/expensebot
```

---

## Release Process

### Version Numbering (Semantic Versioning)

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1 (patch - bug fix)
1.0.1 → 1.1.0 (minor - new feature)
1.1.0 → 2.0.0 (major - breaking change)
```

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Deployment successful
- [ ] Smoke tests passed
- [ ] Rollback plan ready

### Creating a Release

```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Update CHANGELOG.md
# Add release notes

# 3. Commit
git add .
git commit -m "chore: release v1.0.1"

# 4. Create tag
git tag -a v1.0.1 -m "Release v1.0.1"

# 5. Push
git push origin develop --tags

# 6. Create release on GitHub
# Add release notes
```

---

## Questions?

หากมีคำถามหรือต้องการความช่วยเหลือ:

1. เช็ค [Documentation](../README.md)
2. เช็ค [Troubleshooting Guide](./TROUBLESHOOTING.md)
3. เปิด Issue ใน GitHub
4. ถาม maintainers

---

**ขอบคุณที่มีส่วนร่วมในโปรเจ็ค! 🙏**
