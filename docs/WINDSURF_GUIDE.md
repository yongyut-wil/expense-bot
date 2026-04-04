# 🌊 คู่มือการใช้งาน Windsurf Cascade

คู่มือฉบับสมบูรณ์สำหรับการใช้งาน Windsurf Cascade AI Assistant พร้อมการปรับแต่งด้วย Skills, Rules, Workflows และ Memories

---

## 📚 สารบัญ

1. [Windsurf Cascade คืออะไร](#windsurf-cascade-คืออะไร)
2. [Skills - ทักษะเฉพาะทาง](#skills---ทักษะเฉพาะทาง)
3. [Rules - กฎและมาตรฐาน](#rules---กฎและมาตรฐาน)
4. [Workflows - ขั้นตอนการทำงาน](#workflows---ขั้นตอนการทำงาน)
5. [Memories - ความทรงจำอัตโนมัติ](#memories---ความทรงจำอัตโนมัติ)
6. [AGENTS.md - กฎเฉพาะ Directory](#agentsmd---กฎเฉพาะ-directory)
7. [เปรียบเทียบและเลือกใช้](#เปรียบเทียบและเลือกใช้)
8. [ตัวอย่างการใช้งานจริง](#ตัวอย่างการใช้งานจริง)

---

## 🤖 Windsurf Cascade คืออะไร

**Windsurf Cascade** คือ AI Assistant ที่ช่วยในการเขียนโค้ด โดยมีความสามารถพิเศษในการ:

- ✅ อ่านและเข้าใจ codebase ทั้งหมด
- ✅ แก้ไขโค้ดได้หลายไฟล์พร้อมกัน
- ✅ รันคำสั่ง terminal
- ✅ สร้างและแก้ไขโปรเจคทั้งหมด
- ✅ จดจำบริบทและปรับแต่งตามความต้องการ

### การปรับแต่ง Cascade

Windsurf มีระบบปรับแต่ง 4 แบบหลัก:

| ประเภท        | จุดประสงค์                                  | การเรียกใช้                  |
| ------------- | ------------------------------------------- | ---------------------------- |
| **Skills**    | ขั้นตอนการทำงานที่ซับซ้อน พร้อมไฟล์สนับสนุน | อัตโนมัติ หรือ `@skill-name` |
| **Rules**     | กฎการเขียนโค้ด มาตรฐาน ข้อจำกัด             | ตาม activation mode          |
| **Workflows** | Template สำหรับงานซ้ำๆ                      | Manual: `/workflow-name`     |
| **Memories**  | บริบทที่ Cascade สร้างขึ้นเองอัตโนมัติ      | อัตโนมัติเมื่อเกี่ยวข้อง     |

---

## 🚀 Cascade Features & Modes

### การเปิดใช้งาน Cascade

เปิด Cascade ได้ง่ายๆ ผ่าน:

- 🔘 ปุ่ม **Cascade** ใน Editor
- ⌨️ คีย์ลัด: **Cmd+L** (Mac) / **Ctrl+L** (Windows/Linux)

### โหมดการทำงานหลัก (Modes)

Cascade มี **2 โหมด** หลักตามจุดประสงค์การใช้งาน:

#### 1. 💻 Code Mode

**จุดประสงค์:** ให้ AI ลงมือแก้ไขโค้ดจริงๆ ใน codebase

**ความสามารถ:**

- เขียนโค้ดใหม่
- แก้ไขไฟล์ที่มีอยู่
- Refactoring โครงสร้างโปรเจกต์
- สร้างไฟล์และ directory ใหม่
- ลบหรือเปลี่ยนชื่อไฟล์

**เมื่อไหร่ใช้:**

- ต้องการให้ AI เขียนโค้ดให้
- แก้บั๊ก
- เพิ่มฟีเจอร์ใหม่
- Refactor โค้ด

**ตัวอย่าง:**

```
"เพิ่ม validation สำหรับ email field"
"แก้บั๊กที่ function calculateTotal"
"Refactor service layer ให้ใช้ dependency injection"
```

#### 2. 💬 Chat Mode

**จุดประสงค์:** สนทนา สอบถาม ขอคำแนะนำ โดยไม่แก้ไขโค้ด

**ความสามารถ:**

- อธิบายหลักการเขียนโปรแกรม
- วิเคราะห์โค้ด
- เสนอแนะแนวทาง
- แสดงตัวอย่างโค้ด (แต่ไม่แก้ไฟล์)

**เมื่อไหร่ใช้:**

- อยากเข้าใจโค้ด
- ถามวิธีแก้ปัญหา
- ขอคำแนะนำ best practices
- เรียนรู้เทคโนโลยีใหม่

**ตัวอย่าง:**

```
"อธิบายว่า Factory Pattern ทำงานยังไง"
"แนะนำวิธี optimize database query"
"SOLID principles คืออะไร"
```

---

### ⚙️ ฟีเจอร์ด้านการจัดการงาน (Planning & Workflow)

#### 1. 📋 Plans and Todo Lists

**Planning Agent** จะช่วยวางแผนงานซับซ้อนและสร้าง Todo List

**ความสามารถ:**

- แบ่งงานใหญ่เป็นขั้นตอนย่อยๆ
- ติดตามความคืบหน้า (pending/in_progress/completed)
- ปรับแผนได้ตลอดเวลา
- แสดงภาพรวมงานที่เหลือ

**ตัวอย่างการใช้:**

```
คุณ: "ช่วยสร้าง REST API สำหรับ user management"

Cascade: [สร้าง Plan]
✅ 1. Design API endpoints
⏳ 2. Create User model with Prisma
⬜ 3. Implement CRUD operations
⬜ 4. Add authentication middleware
⬜ 5. Write tests
```

#### 2. 📬 Queued Messages

**คิวคำสั่ง** - พิมพ์คำสั่งถัดไปรอไว้ได้เลย แม้ AI ยังทำงานไม่เสร็จ

**ประโยชน์:**

- ไม่ต้องรอให้ AI ทำงานเสร็จก่อน
- ทำงานหลายอย่างต่อเนื่อง
- ประหยัดเวลา

**ตัวอย่าง:**

```
คำสั่งที่ 1: "เพิ่ม User model"
  [Cascade กำลังทำ...]

คำสั่งที่ 2: "เขียน tests สำหรับ User model"
  [รออยู่ใน Queue]

คำสั่งที่ 3: "Update documentation"
  [รออยู่ใน Queue]
```

#### 3. 🎯 Real-time Awareness

Cascade **รับรู้สิ่งที่คุณทำอยู่** แบบ real-time

**รู้อะไรบ้าง:**

- ไฟล์ที่เปิดอยู่
- ตำแหน่ง cursor
- Code ที่ highlight
- Changes ที่ยังไม่ save

**ประโยชน์:**

- ไม่ต้อง copy-paste โค้ดมาวาง
- แค่พิมพ์ "Continue" มันก็รู้ว่าต้องทำอะไรต่อ
- เข้าใจบริบทโดยอัตโนมัติ

**ตัวอย่าง:**

```
[คุณเปิดไฟล์ user.service.ts และ highlight function getUserById]

คุณ: "แก้ให้รองรับ error handling"
Cascade: [รู้เลยว่าต้องแก้ function ไหน]
```

---

### 🛠️ เครื่องมือและการช่วยเหลือ (Tool Calling & Integration)

#### 1. 🔧 Tool Calling

Cascade สามารถ**เรียกใช้เครื่องมือ**ได้เองอัตโนมัติ:

**เครื่องมือที่มี:**

| Tool            | ความสามารถ                 |
| --------------- | -------------------------- |
| **Search**      | ค้นหาโค้ดใน codebase       |
| **Read File**   | อ่านไฟล์                   |
| **Edit File**   | แก้ไขไฟล์                  |
| **Create File** | สร้างไฟล์ใหม่              |
| **Run Command** | รันคำสั่ง Terminal         |
| **Web Search**  | ค้นหาข้อมูลบนอินเทอร์เน็ต  |
| **Grep Search** | ค้นหาแบบ regex ใน codebase |

**ตัวอย่างการใช้:**

```
คุณ: "ติดตั้ง express และสร้าง basic server"

Cascade:
1. [รัน Terminal] npm install express
2. [สร้างไฟล์] src/index.ts
3. [เขียนโค้ด] basic Express server
4. [อัพเดท] package.json scripts
```

#### 2. 🔍 Linter Integration

**Auto-fix linting errors** - แก้ไข syntax errors อัตโนมัติ

**การทำงาน:**

1. Cascade เขียนโค้ด
2. ถ้ามี linting error → แก้ไขให้อัตโนมัติ
3. ตรวจสอบอีกครั้ง
4. แจ้งเตือนถ้ายังมีปัญหา

**รองรับ:**

- ESLint
- Prettier
- TypeScript Compiler
- และ linters อื่นๆ ที่ติดตั้งในโปรเจกต์

#### 3. 🐛 Send Problems to Cascade

**ส่ง Error ให้ AI แก้** จาก Problems panel

**วิธีใช้:**

1. เปิด Problems panel (ดู errors/warnings)
2. คลิกขวาที่ error
3. เลือก **"Send to Cascade"**
4. Cascade จะวิเคราะห์และแก้ไขให้

**ตัวอย่าง Error ที่แก้ได้:**

- TypeScript type errors
- Import errors
- Syntax errors
- Linting warnings

---

### 🔒 การควบคุมและความปลอดภัย (Control & Safety)

#### 1. ⏮️ Checkpoints & Reverts

**Checkpoint** = Snapshot ของ codebase ในจุดเวลาหนึ่ง

**ความสามารถ:**

- สร้าง checkpoint ก่อนให้ AI แก้ไข
- **Revert** กลับไปยัง checkpoint ได้ถ้าไม่ชอบ
- ดูประวัติการเปลี่ยนแปลง
- เปรียบเทียบ before/after

**วิธีใช้:**

```
1. ก่อนสั่ง AI → สร้าง checkpoint
2. ให้ AI ทำงาน
3. ถ้าไม่พอใจ → Revert
4. ถ้าชอบ → Keep changes
```

**Use Cases:**

- ทดลองแก้โค้ดแบบใหม่
- ทดสอบ refactoring
- Experiment กับ AI suggestions

#### 2. 🚫 Ignoring Files (.codeiumignore)

**ป้องกันไม่ให้ AI เข้าถึงไฟล์บางตัว**

**รูปแบบไฟล์:**

**Project-level** (`.codeiumignore` ใน root):

```gitignore
# Secrets
.env
.env.local
*.key

# Sensitive data
/data/private/
/config/credentials.json

# Large files
/node_modules/
/dist/
*.log
```

**Global-level** (`~/.codeium/ignore`):

```gitignore
# Personal files
*.personal.md
/temp/
```

**ประโยชน์:**

- ✅ ป้องกัน leak ข้อมูลลับ
- ✅ ลด context ที่ไม่จำเป็น
- ✅ เพิ่มความเร็ว (ไม่ต้องอ่านไฟล์ใหญ่ๆ)

---

### 👥 ฟีเจอร์สำหรับทีมและการใช้งานขั้นสูง

#### 1. 🔄 Simultaneous Cascades

**เปิดหลาย Cascade พร้อมกัน** - ทำงานหลายอย่างได้พร้อมกัน

**Use Cases:**

- งาน A: แก้บั๊ก
- งาน B: เพิ่มฟีเจอร์
- งาน C: เขียน documentation

**คำแนะนำ:**

- ใช้ร่วมกับ **Git Worktrees** เพื่อป้องกัน conflicts
- แยกงานที่ไม่เกี่ยวข้องกัน
- ระวังการแก้ไฟล์เดียวกัน

**ตัวอย่าง:**

```
Terminal 1: Cascade แก้ backend (branch: fix/user-auth)
Terminal 2: Cascade ทำ frontend (branch: feature/dashboard)
Terminal 3: Cascade เขียน tests (branch: test/coverage)
```

#### 2. 📤 Sharing & Mentions (Enterprise)

**สำหรับองค์กร** - แชร์และอ้างอิงบทสนทนา

**Sharing:**

- แชร์ประวัติการคุยกับทีม
- ให้เพื่อนร่วมทีมดูวิธีแก้ปัญหา
- สอนทีมใหม่

**@Mentions:**

- `@conversation-id` - อ้างอิงบทสนทนาเก่า
- ดึงบริบทจาก conversation อื่นมาใช้
- ความรู้สะสมในทีม

**ตัวอย่าง:**

```
คุณ: "@conversation-123 ใช้วิธีเดียวกันแก้บั๊กนี้ด้วย"
Cascade: [อ่านบริบทจาก conversation 123 และนำมาใช้]
```

---

### 💡 Tips & Best Practices

#### เลือกโหมดให้ถูก

- 💻 ต้องการแก้โค้ด → **Code Mode**
- 💬 ต้องการคำอธิบาย → **Chat Mode**

#### ใช้ Planning สำหรับงานใหญ่

- แบ่งงานซับซ้อนเป็น steps
- ติดตามความคืบหน้า
- ปรับแผนได้ตลอด

#### Checkpoint ก่อนทำงานใหญ่

- สร้าง checkpoint ก่อน refactoring
- Revert ได้ถ้าผิดพลาด
- ทดลองได้อย่างปลอดภัย

#### ใช้ .codeiumignore

- ป้องกันไฟล์ sensitive
- ลดขนาด context
- เพิ่มความเร็ว

---

## 🎯 Skills - ทักษะเฉพาะทาง

### Skills คืออะไร?

**Skills** เปรียบเสมือนคู่มือการทำงานที่มีหลายขั้นตอน พร้อมไฟล์สนับสนุน เช่น สคริปต์, template, checklist

### โครงสร้างของ Skill

```
.windsurf/skills/
└── deploy-production/           ← ชื่อ skill
    ├── SKILL.md                 ← ไฟล์หลัก (จำเป็น)
    ├── pre-deploy-checklist.md  ← ไฟล์สนับสนุน (ถ้ามี)
    ├── rollback-steps.md
    └── nginx-config.conf
```

### ไฟล์ SKILL.md

ทุก skill ต้องมีไฟล์ `SKILL.md` พร้อม YAML frontmatter:

```markdown
---
name: deploy-production
description: คู่มือการ deploy ขึ้น production พร้อม safety checks
tags:
  - deployment
  - production
  - docker
---

# Production Deployment Guide

## Pre-deployment Checklist

1. รัน tests ให้ผ่านหมด
2. ตรวจสอบ uncommitted changes
3. Verify environment variables

## Deployment Steps

...
```

#### Required Fields

- **name**: ชื่อเฉพาะของ skill (ใช้ตัวพิมพ์เล็ก, ตัวเลข, และ hyphen)
- **description**: คำอธิบายสั้นๆ ที่ช่วยให้ Cascade รู้ว่าเมื่อไหร่ควรใช้
- **tags** (optional): ป้ายกำกับสำหรับจัดหมวดหมู่

### การสร้าง Skill

#### วิธีที่ 1: ผ่าน UI (แนะนำ)

1. เปิด Cascade panel
2. คลิกจุด 3 จุด (top-right) → เปิด Customizations menu
3. ไปที่ **Skills** section
4. คลิก **+ Workspace** (เฉพาะโปรเจค) หรือ **+ Global** (ทุกโปรเจค)
5. ตั้งชื่อ skill
6. เขียนเนื้อหาใน SKILL.md

#### วิธีที่ 2: สร้างด้วยมือ

**Workspace Skill** (เฉพาะโปรเจค):

```bash
# 1. สร้าง directory
mkdir -p .windsurf/skills/my-skill

# 2. สร้างไฟล์ SKILL.md
cat > .windsurf/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: คำอธิบายสั้นๆ ว่า skill นี้ทำอะไร
---

# My Skill Guide

ขั้นตอนการทำงาน...
EOF

# 3. Commit เข้า git (แชร์กับทีม)
git add .windsurf/skills/
git commit -m "Add my-skill"
```

**Global Skill** (ใช้ได้ทุกโปรเจค):

```bash
mkdir -p ~/.codeium/windsurf/skills/my-global-skill
# จากนั้นสร้าง SKILL.md เหมือนด้านบน
```

### การเรียกใช้ Skill

#### 1. Automatic Invocation (อัตโนมัติ)

Cascade จะเรียกใช้เองเมื่อคำอธิบายของคุณตรงกับ description ของ skill

**ตัวอย่าง:**

```
คุณ: "ช่วยแนะนำวิธี deploy ขึ้น production หน่อย"
Cascade: [อ่าน @deploy-production skill อัตโนมัติ]
```

#### 2. Manual Invocation (@mention)

เรียกใช้โดยตรงด้วย `@skill-name`:

```
@deploy-production show me the deployment checklist
@add-ai-provider how do I add OpenAI?
@database-migration guide me through adding a new field
```

### Progressive Disclosure

Cascade ใช้เทคนิค **Progressive Disclosure**:

- ตอนแรก: เห็นแค่ `name` และ `description`
- เมื่อเรียกใช้: โหลดเนื้อหาทั้งหมดรวมไฟล์สนับสนุน
- **ประโยชน์**: ช่วยลด context window ให้เบา

### Skill Scopes

| Scope             | ตำแหน่ง                            | ใช้ได้กับ             |
| ----------------- | ---------------------------------- | --------------------- |
| **Workspace**     | `.windsurf/skills/`                | โปรเจคปัจจุบัน        |
| **Global**        | `~/.codeium/windsurf/skills/`      | ทุกโปรเจค (local)     |
| **System** (Ent.) | `/Library/Application Support/...` | ทุกโปรเจค (read-only) |

### ตัวอย่าง Skills ในโปรเจคนี้

```
.windsurf/skills/
├── expense-bot-architecture/    ← สถาปัตยกรรมโปรเจค
├── add-ai-provider/             ← เพิ่ม AI provider ใหม่
├── database-migration/          ← การทำ database migration
└── deploy-production/           ← Deploy ขึ้น production
```

**การใช้งาน:**

```
@expense-bot-architecture explain the database schema
@add-ai-provider how to add Anthropic Claude?
@database-migration help me rename a column
@deploy-production show deployment steps
```

---

## 📏 Rules - กฎและมาตรฐาน

### Rules คืออะไร?

**Rules** เป็นกฎที่บอก Cascade ว่าควร**ทำงานอย่างไร** เช่น:

- Coding conventions (ใช้ `const` แทน `let`)
- Style guides (ตั้งชื่อตัวแปรแบบ camelCase)
- Project constraints (ห้ามใช้ `any` type)

### โครงสร้างของ Rules

**Workspace Rules** (แชร์กับทีม):

```
.windsurf/rules/
├── typescript-standards.md
├── database-patterns.md
└── security-standards.md
```

**Global Rules** (ส่วนตัว):

```
~/.codeium/windsurf/memories/
└── global_rules.md              ← ไฟล์เดียว
```

### รูปแบบไฟล์ Rule

**Workspace Rule** (มี frontmatter):

```markdown
---
trigger: always_on
---

# TypeScript Standards

## Type Safety

- Never use `any` type
- All functions must have explicit return types
- Use strict TypeScript configuration

## Naming Conventions

- Use camelCase for variables
- Use PascalCase for classes
```

**Global Rule** (ไม่มี frontmatter):

```markdown
# My Personal Rules

- Always use early returns
- Prefer functional programming
- Write tests first (TDD)
```

### Activation Modes

Rules มี 4 โหมดการเปิดใช้งาน:

#### 1. `always_on` - เปิดตลอดเวลา

```markdown
---
trigger: always_on
---

# TypeScript Standards

- Use explicit return types
- No `any` types
```

**เมื่อไหร่ใช้:** กฎที่ใช้ทั้งโปรเจค เช่น coding style, security

**Context cost:** ทุกข้อความ

#### 2. `model_decision` - Cascade ตัดสินใจ

```markdown
---
trigger: model_decision
---

# Architecture Guidelines

- Use Factory Pattern for multi-provider
- Implement Repository Pattern
```

**เมื่อไหร่ใช้:** กฎที่เกี่ยวข้องบางครั้ง

**Context cost:** Description ตลอด, เนื้อหาเต็มเมื่อ Cascade เห็นว่าจำเป็น

#### 3. `glob` - เฉพาะไฟล์ที่ตรงกับ pattern

```markdown
---
trigger: glob
globs: "**/*.test.ts,**/__tests__/**"
---

# Testing Standards

- Use `describe` blocks
- Follow AAA pattern
- Mock external dependencies
```

**เมื่อไหร่ใช้:** กฎเฉพาะไฟล์บางประเภท

**Context cost:** เฉพาะเมื่ออ่าน/แก้ไฟล์ที่ตรง

**Glob Patterns:**

- `**/*.ts` - ทุกไฟล์ TypeScript
- `**/*.test.ts` - ไฟล์ test
- `src/**/*.prisma` - Prisma schema ใน src/
- `**/services/ai/**` - ทุกอย่างใน services/ai/

#### 4. `manual` - เรียกใช้ด้วยมือ

```markdown
---
trigger: manual
---

# Deployment Checklist

- Run tests
- Update changelog
- Tag release
```

**เมื่อไหร่ใช้:** Checklist ที่ต้องการเรียกเอง

**Context cost:** เฉพาะเมื่อ `@rule-name`

### การสร้าง Rule

#### ผ่าน UI:

1. Click **Customizations** → **Rules**
2. Click **+ Workspace** หรือ **+ Global**
3. เขียนเนื้อหา rule

#### สร้างด้วยมือ:

```bash
# Workspace rule
cat > .windsurf/rules/my-rule.md << 'EOF'
---
trigger: always_on
---

# My Coding Rules

- Rule 1
- Rule 2
EOF

git add .windsurf/rules/
git commit -m "Add coding rules"
```

### Rules Discovery

Windsurf หา rules จาก:

1. `.windsurf/rules/` ใน workspace ปัจจุบัน
2. `.windsurf/rules/` ใน sub-directories
3. `.windsurf/rules/` ใน parent directories (ถึง git root)

### ข้อจำกัด

- **Workspace rule**: สูงสุด 12,000 ตัวอักษรต่อไฟล์
- **Global rule**: สูงสุด 6,000 ตัวอักษร (ไฟล์เดียว)

### Best Practices

✅ **ควรทำ:**

- เขียนสั้น กระชับ เฉพาะเจาะจง
- ใช้ bullet points, numbered lists
- จัดกลุ่มด้วย XML tags
- Version control (commit เข้า git)

❌ **ไม่ควร:**

- เขียนกฎคลุมเครือ ("write good code")
- ยาวเกิน 12,000 ตัวอักษร
- ซ้ำกับความรู้ที่ AI มีอยู่แล้ว
- เปิด `always_on` เยอะเกินไป

### ตัวอย่างการจัดกลุ่มด้วย XML

```markdown
<coding_guidelines>

- Use explicit return types
- Prefer const over let
- Use early returns
  </coding_guidelines>

<error_handling>

- Use custom error classes
- Log errors with Winston
- Never expose stack traces
  </error_handling>
```

### ตัวอย่าง Rules ในโปรเจคนี้

```
.windsurf/rules/
├── typescript-standards.md      (always_on)
├── database-patterns.md         (glob: **/*.prisma)
├── ai-integration.md            (glob: **/services/ai/**)
├── security-standards.md        (always_on)
├── testing-standards.md         (glob: **/*.test.ts)
└── line-bot-patterns.md         (glob: **/services/line.ts)
```

---

## 🔄 Workflows - ขั้นตอนการทำงาน

### Workflows คืออะไร?

**Workflows** เป็น prompt templates สำหรับงานที่ทำซ้ำๆ เช่น:

- Code review
- Deployment procedures
- Release checklists
- PR creation

### โครงสร้าง

```
.windsurf/workflows/
├── review.md
├── deploy.md
└── release.md
```

### รูปแบบไฟล์

```markdown
---
description: Review code changes for bugs and improvements
---

You are a senior software engineer performing code review.

Focus on:

1. Logic errors
2. Edge cases
3. Security vulnerabilities
4. Performance issues
5. Code style
```

### การเรียกใช้

Workflows เรียกใช้ด้วย **slash command เท่านั้น**:

```
/review                 ← เรียก workflow ชื่อ review
/deploy                 ← เรียก workflow ชื่อ deploy
/release                ← เรียก workflow ชื่อ release
```

### Turbo Mode (Auto-run)

เพิ่ม `// turbo` comment ก่อนขั้นตอนที่ต้องการให้รันอัตโนมัติ:

```markdown
---
description: Deploy to staging
---

1. Run tests

// turbo 2. Build Docker image

// turbo 3. Push to registry

4. Update deployment
```

ขั้นตอนที่มี `// turbo` จะ auto-run คำสั่งโดยไม่ถามผู้ใช้

### ตัวอย่าง Workflow

**`.windsurf/workflows/review.md`**

```markdown
---
description: Review code changes for bugs, security, and improvements
---

You are a senior software engineer performing code review.

Focus on:

1. **Logic errors** - Incorrect behavior, wrong conditions
2. **Edge cases** - Null checks, array bounds, empty states
3. **Security** - SQL injection, XSS, exposed secrets
4. **Performance** - N+1 queries, memory leaks
5. **Code style** - Naming, formatting, complexity

Provide:

- Severity: Critical / High / Medium / Low
- Location: File and line number
- Issue: What's wrong
- Suggestion: How to fix
```

**การใช้:**

```
/review
```

Cascade จะ review โค้ดตามขั้นตอนที่กำหนด

---

## 🧠 Memories - ความทรงจำอัตโนมัติ

### Memories คืออะไร?

**Memories** เป็นบริบทที่ Cascade **สร้างอัตโนมัติ** ระหว่างการสนทนา เมื่อเจอข้อมูลที่น่าจะมีประโยชน์

### คุณสมบัติ

- 🏠 เก็บที่: `~/.codeium/windsurf/memories/` (local เท่านั้น)
- 👤 Personal: ใช้ได้แค่เครื่องคุณ
- 🤖 Auto-generated: Cascade สร้างเอง
- 🆓 ไม่เสีย credits
- ❌ ไม่ commit เข้า git

### การสร้าง Memory

#### 1. Automatic

Cascade สร้างเองเมื่อเจอบริบทที่สำคัญ

#### 2. Manual

บอก Cascade ให้สร้าง:

```
"Create a memory that this project uses Google Gemini 1.5 Pro"
"Remember that we prefer upsert pattern over separate create/update"
```

### การจัดการ Memories

1. Click **Customizations** icon (top-right)
2. ไปที่ **Memories** panel
3. Edit หรือลบ memories ที่ไม่ต้องการ

### เมื่อไหร่ควรใช้?

✅ **ใช้ Memories สำหรับ:**

- Session-specific context
- Temporary experiments
- Personal preferences

❌ **ไม่ควรใช้ Memories สำหรับ:**

- ความรู้ที่ทีมควรรู้ → ใช้ **Rules**
- Coding standards → ใช้ **Rules**
- ขั้นตอนการทำงาน → ใช้ **Skills** หรือ **Workflows**

### คำแนะนำ

> **จาก Windsurf:** สำหรับความรู้ที่ต้องการให้ Cascade ใช้ซ้ำได้เชื่อถือได้ ควรเขียนเป็น **Rule** หรือ **AGENTS.md** แทนการพึ่ง auto-generated Memories

---

## 📂 AGENTS.md - กฎเฉพาะ Directory

### AGENTS.md คืออะไร?

**AGENTS.md** เป็นรูปแบบพิเศษของ Rules ที่ใช้ได้โดยไม่ต้องมี frontmatter

### การทำงาน

- **Root level** `AGENTS.md` → เหมือน `always_on`
- **Sub-directory** `AGENTS.md` → เหมือน `glob` สำหรับ directory นั้น

### ตัวอย่าง

**`/AGENTS.md`** (root):

```markdown
# Project-wide Rules

- Use TypeScript strict mode
- Follow conventional commits
```

→ ใช้กับทั้งโปรเจค (always on)

**`/src/services/AGENTS.md`**:

```markdown
# Services Layer Rules

- All services must return promises
- Use dependency injection
```

→ ใช้เฉพาะเมื่อทำงานใน `src/services/`

### ข้อดี

- ✅ ไม่ต้องเขียน frontmatter
- ✅ กำหนดขอบเขตได้ง่าย (ตาม directory)
- ✅ เหมาะกับ directory-specific conventions

---

## ⚖️ เปรียบเทียบและเลือกใช้

### ตารางเปรียบเทียบแบบละเอียด

| Feature           | Skills                             | Rules                     | Workflows              | Memories          |
| ----------------- | ---------------------------------- | ------------------------- | ---------------------- | ----------------- |
| **จุดประสงค์**    | ขั้นตอนงานซับซ้อน + ไฟล์สนับสนุน   | กฎการเขียนโค้ด มาตรฐาน    | Template งานซ้ำๆ       | บริบทอัตโนมัติ    |
| **โครงสร้าง**     | Folder + SKILL.md + support files  | ไฟล์ .md เดียว            | ไฟล์ .md เดียว         | Auto-generated    |
| **การเรียกใช้**   | อัตโนมัติ หรือ `@skill-name`       | ตาม activation mode       | `/workflow-name`       | อัตโนมัติ         |
| **System prompt** | ไม่ (แค่ name + description)       | ขึ้นกับ activation mode   | ไม่                    | ไม่               |
| **Storage**       | `.windsurf/skills/`                | `.windsurf/rules/`        | `.windsurf/workflows/` | `~/.codeium/.../` |
| **Sharing**       | ✅ Git (team)                      | ✅ Git (team)             | ✅ Git (team)          | ❌ Local only     |
| **Best for**      | Deploy, migrations, complex guides | Coding style, conventions | Checklists, reviews    | Temporary context |

### Decision Tree

```
คุณต้องการอะไร?
├─ ขั้นตอนการทำงานที่ซับซ้อน พร้อมไฟล์อ้างอิง
│  └─→ ใช้ Skills
│
├─ กฎการเขียนโค้ด มาตรฐาน ที่ต้องการบังคับใช้
│  └─→ ใช้ Rules
│
├─ Checklist หรือ template ที่เรียกใช้เอง
│  └─→ ใช้ Workflows
│
└─ ความทรงจำชั่วคราวของ session
   └─→ ปล่อยให้เป็น Memories (auto)
```

### แนวทางแนะนำ

**ใช้ Skills เมื่อ:**

- ต้องการสอนวิธีทำงานที่มีหลายขั้นตอน
- มีไฟล์อ้างอิง (scripts, templates, configs)
- ต้องการให้ Cascade เลือกใช้เองอัตโนมัติ

**ตัวอย่าง:** Database migration guide, Deployment procedures, Architecture patterns

**ใช้ Rules เมื่อ:**

- ต้องการบังคับใช้มาตรฐาน
- กฎสั้นๆ กระชับ
- ต้องการแชร์กับทีม

**ตัวอย่าง:** TypeScript standards, Security policies, Naming conventions

**ใช้ Workflows เมื่อ:**

- ต้องการเรียกใช้เองเสมอ (ไม่ใช่อัตโนมัติ)
- เป็น checklist แบบ step-by-step
- ใช้กับงานประจำที่ซ้ำๆ

**ตัวอย่าง:** Code review, Release process, PR template

**ใช้ Memories เมื่อ:**

- บริบทชั่วคราวของ session
- ข้อมูลที่ไม่จำเป็นต้องแชร์
- ทดลองหรือ experiment

**ตัวอย่าง:** "User X prefers detailed explanations", "Testing new API endpoint"

---

## 💼 ตัวอย่างการใช้งานจริง

### Scenario 1: เพิ่ม AI Provider ใหม่

**คุณ:**

```
@add-ai-provider ช่วยแนะนำวิธีเพิ่ม OpenAI provider หน่อย
```

**Cascade:**

```
[อ่าน .windsurf/skills/add-ai-provider/SKILL.md]

ได้เลยครับ จะแนะนำขั้นตอนการเพิ่ม OpenAI provider:

Step 1: Create Provider Implementation
สร้างไฟล์ src/services/openai.ts...

[ตามด้วยขั้นตอนละเอียด]
```

### Scenario 2: แก้ไขโค้ดตาม Rules

**คุณเขียนโค้ด:**

```typescript
// ไฟล์: src/services/expense.ts
function createExpense(data: any) {
  // ⚠️ ใช้ any
  const expense = await prisma.expense.create({
    data: data,
  });
}
```

**Cascade:**

```
[ตรวจพบ Rule: typescript-standards.md (always_on)]

พบปัญหา:
❌ ใช้ type `any` ซึ่งไม่แนะนำตาม TypeScript Standards

แนะนำแก้เป็น:

function createExpense(data: CreateExpenseInput): Promise<Expense> {
  ...
}

โดยสร้าง interface CreateExpenseInput แยกไว้
```

### Scenario 3: Database Migration

**คุณ:**

```
@database-migration ผมต้องการเพิ่ม field receiptUrl ลงใน Expense table
```

**Cascade:**

```
[อ่าน .windsurf/skills/database-migration/SKILL.md]

ได้ครับ แนะนำขั้นตอนดังนี้:

Step 1: Modify Prisma Schema
แก้ไข prisma/schema.prisma:

model Expense {
  id          String   @id @default(cuid())
  ...
  receiptUrl  String?  // เพิ่มบรรทัดนี้ (optional)
}

Step 2: Create Migration
npm run prisma:migrate

[จากนั้นอธิบายขั้นตอนต่อไป...]
```

### Scenario 4: Code Review

**คุณ:**

```
/review
```

**Cascade:**

```
[อ่าน .windsurf/workflows/review.md]

กำลัง review code changes...

Found Issues:

1. ❌ CRITICAL - Security Vulnerability
   File: src/handlers/webhook.ts:45
   Issue: Signature verification bypassed in development mode
   Suggestion: Remove development bypass in production

2. ⚠️ HIGH - Logic Error
   File: src/services/expense.ts:120
   Issue: Missing null check for category
   Suggestion: Add optional chaining: category?.name

[รายละเอียดเพิ่มเติม...]
```

### Scenario 5: Glob Rule Activation

**คุณเปิดไฟล์:**

```typescript
// ไฟล์: src/__tests__/services/expense.test.ts
```

**Cascade:**

```
[โหลด Rule: testing-standards.md (glob: **/*.test.ts)]

เตรียมพร้อมช่วยเขียน test ตาม Testing Standards:
- ใช้ describe blocks
- Follow AAA pattern
- Mock dependencies
```

---

## 🎓 เคล็ดลับและ Best Practices

### สำหรับ Skills

1. **เขียน description ให้ดี**
   - อธิบายชัดเจนว่า skill ทำอะไร
   - ช่วยให้ Cascade ตัดสินใจได้ถูกต้อง

2. **รวมไฟล์สนับสนุน**
   - Templates, scripts, configs
   - ตัวอย่างโค้ด

3. **ใช้ชื่อที่สื่อความหมาย**
   - `deploy-to-staging` ดีกว่า `deploy1`

### สำหรับ Rules

1. **เขียนสั้น กระชับ**
   - หลีกเลี่ยงกฎยาวเกินไป
   - แยกเป็นหลายไฟล์ได้

2. **ใช้ glob อย่างชาญฉลาด**
   - ลด context cost
   - เฉพาะไฟล์ที่เกี่ยวข้อง

3. **ไม่ต้องเขียนสิ่งที่ AI รู้อยู่แล้ว**
   - หลีกเลี่ยง "write clean code"
   - เขียนเฉพาะกฎเฉพาะโปรเจค

### สำหรับ Workflows

1. **ใช้กับงานที่ทำบ่อย**
   - Code review, deployment, release

2. **เขียน step-by-step ชัดเจน**
   - ง่ายต่อการทำตาม

3. **ใช้ turbo mode อย่างระมัดระวัง**
   - เฉพาะคำสั่งที่ปลอดภัย

### การจัดระเบียบ

**โครงสร้างที่แนะนำ:**

```
โปรเจค/
├── .windsurf/
│   ├── skills/
│   │   ├── architecture/
│   │   ├── deployment/
│   │   └── development/
│   ├── rules/
│   │   ├── typescript.md
│   │   ├── database.md
│   │   └── security.md
│   └── workflows/
│       ├── review.md
│       └── deploy.md
└── docs/
    └── WINDSURF_GUIDE.md  ← เอกสารนี้
```

---

## 🔍 Troubleshooting

### Skill ไม่ทำงาน

**ปัญหา:** Cascade ไม่เรียกใช้ skill อัตโนมัติ

**วิธีแก้:**

1. ตรวจ `description` - ต้องสื่อความหมายชัดเจน
2. ใช้ `@skill-name` manual invocation
3. ตรวจโครงสร้าง folder/SKILL.md ถูกต้อง

### Rule ไม่ active

**ปัญหา:** Cascade ไม่ follow rule

**วิธีแก้:**

1. ตรวจ `trigger` mode - ตั้งค่าถูกต้องหรือไม่
2. ถ้าใช้ `glob` - ตรวจ pattern ตรงกับไฟล์หรือไม่
3. ถ้าใช้ `model_decision` - description ชัดเจนพอหรือไม่

### Context window เต็ม

**ปัญหา:** Cascade บอกว่า context เต็ม

**วิธีแก้:**

1. ลดจำนวน `always_on` rules
2. ใช้ `glob` แทน `always_on` ถ้าเป็นไปได้
3. ใช้ `model_decision` สำหรับ rules ที่ไม่จำเป็นตลอด

---

## 📖 Resources เพิ่มเติม

### Official Documentation

- [Windsurf Cascade Docs](https://docs.windsurf.com)
- [Agent Skills Specification](https://agentskills.io)

### ในโปรเจคนี้

- [README.md](../README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guide

### Community

- [Windsurf Directory](https://windsurf.com/editor/directory) - Rule templates

---

## 📝 สรุป

### Key Takeaways

1. **Skills** = Complex procedures + support files
   - ใช้เมื่อ: ขั้นตอนซับซ้อน, ต้องการไฟล์อ้างอิง
   - เรียก: อัตโนมัติ หรือ `@skill-name`

2. **Rules** = Coding standards + conventions
   - ใช้เมื่อ: มาตรฐานการเขียนโค้ด, กฎที่ต้องบังคับ
   - Modes: `always_on`, `glob`, `model_decision`, `manual`

3. **Workflows** = Repeatable checklists
   - ใช้เมื่อ: งานซ้ำๆ, checklist
   - เรียก: `/workflow-name` (manual only)

4. **Memories** = Auto-generated context
   - ใช้เมื่อ: บริบทชั่วคราว, ส่วนตัว
   - เกิดขึ้น: อัตโนมัติ

### Golden Rules

✅ **ทำ:**

- Version control Skills, Rules, Workflows (commit เข้า git)
- เขียน description ที่ชัดเจน
- จัดระเบียบอย่างเป็นระบบ
- Test ก่อน commit

❌ **อย่าทำ:**

- อย่าพึ่งพา Memories สำหรับ knowledge ที่สำคัญ
- อย่าเขียน rules ยาวเกินไป
- อย่าเปิด `always_on` เยอะเกินจำเป็น
- อย่าลืม update เมื่อโครงสร้างเปลี่ยน

---

**สร้างด้วย ❤️ สำหรับทีม Expense Bot**

มีคำถามหรือข้อเสนอแนะ? เปิด Issue หรือ PR ได้เลยครับ! 🚀
