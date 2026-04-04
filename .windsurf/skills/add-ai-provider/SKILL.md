---
name: add-ai-provider
description: Step-by-step guide to add a new AI provider (OpenAI, Anthropic) to the expense parsing system
tags:
  - ai-integration
  - refactoring
  - multi-provider
---

# How to Add a New AI Provider

This skill guides you through adding a new AI provider (e.g., OpenAI, Anthropic) to the Expense Bot's AI parsing system.

## Prerequisites

- New provider's API key
- Understanding of Factory Pattern
- Knowledge of TypeScript interfaces

## Step 1: Create Provider Implementation

Create a new file `src/services/[provider-name].ts`:

```typescript
import { AIProvider, ParsedExpense } from "./types";
import { SYSTEM_PROMPT } from "./ai/prompt";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async parseExpense(text: string): Promise<ParsedExpense> {
    // Implement provider-specific logic
    // Example for OpenAI:
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  async parseExpenseFromImage(imageUrl: string): Promise<ParsedExpense> {
    // Implement OCR logic
    throw new Error("Not implemented");
  }
}
```

## Step 2: Update Factory Function

Edit `src/services/index.ts`:

```typescript
import { GoogleProvider } from "./google";
import { OpenAIProvider } from "./openai"; // New import
import { AIProvider } from "./types";
import { config } from "../config";

export function createAIProvider(): AIProvider {
  switch (config.AI_PROVIDER) {
    case "google":
      return new GoogleProvider(config.GOOGLE_API_KEY);
    case "openai": // New case
      return new OpenAIProvider(config.OPENAI_API_KEY);
    default:
      throw new Error(`Unsupported AI provider: ${config.AI_PROVIDER}`);
  }
}

export const aiProvider = createAIProvider();
```

## Step 3: Update Environment Configuration

Edit `src/config/index.ts`:

```typescript
const configSchema = z.object({
  // ... existing fields
  AI_PROVIDER: z.enum(["google", "openai"]), // Add new provider
  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(), // New field
});
```

## Step 4: Update Environment Files

Add to `.env.example`:

```env
# AI Provider (google, openai)
AI_PROVIDER=google
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

Add to your `.env`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...your-key...
```

## Step 5: Write Tests

Create `src/__tests__/services/openai.test.ts`:

```typescript
import { OpenAIProvider } from "../../services/openai";

describe("OpenAIProvider", () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider("test-key");
  });

  it("should parse expense correctly", async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                type: "EXPENSE",
                amount: 120,
                description: "กินข้าว",
                category: "อาหาร",
              }),
            },
          },
        ],
      }),
    });

    const result = await provider.parseExpense("กินข้าว 120");
    expect(result.type).toBe("EXPENSE");
    expect(result.amount).toBe(120);
  });
});
```

## Step 6: Update Documentation

Update `docs/AI_GUIDE.md` with:

- New provider setup instructions
- API key requirements
- Pricing comparison
- Model selection guide

## Verification Checklist

- [ ] Provider implements `AIProvider` interface
- [ ] Factory function updated
- [ ] Environment config supports new provider
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] `.env.example` updated
- [ ] Error handling implemented
- [ ] Fallback parser still works

## Testing

```bash
# Run tests
npm test

# Test with real API
AI_PROVIDER=openai npm run dev
```

Then send a LINE message to verify parsing works.

## Rollback Plan

If something goes wrong:

```bash
# Revert to Google provider
echo "AI_PROVIDER=google" >> .env
pm2 restart expense-bot
```

## Common Issues

### Issue: API key not found

**Solution:** Check environment variable naming in `.env`

### Issue: Parsing fails

**Solution:**

1. Check SYSTEM_PROMPT compatibility
2. Verify response format
3. Test with fallback parser

### Issue: Rate limiting

**Solution:** Implement retry logic with exponential backoff

## Related Files

- `src/services/types.ts` - AIProvider interface
- `src/services/ai/prompt.ts` - System prompt
- `src/services/fallback.ts` - Fallback parser
- `docs/AI_GUIDE.md` - AI integration documentation
