---
trigger: glob
globs: "**/services/ai/**,**/services/google.ts,**/services/fallback.ts"
---

# AI Integration Guidelines

## Prompt Engineering

- Keep system prompts in dedicated `ai/prompt.ts` file
- Use clear, structured instructions
- Request JSON-only responses from LLMs
- Include validation examples in prompts

## Error Handling & Fallbacks

- Always have a fallback parser (regex-based)
- Catch and log AI service errors
- Return structured error objects
- Never expose raw AI errors to users

## Factory Pattern

- Use `createAIProvider()` factory function
- All providers must implement `AIProvider` interface
- Support multiple providers (Google, OpenAI, Anthropic)
- Make provider selection via environment variable

## Response Validation

- Validate AI responses before using
- Use Zod schemas for response validation
- Log validation failures
- Fall back to regex parser on validation errors
