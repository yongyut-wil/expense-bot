---
trigger: always_on
---

# Security Standards

## Environment Variables

- Never commit `.env` files
- Use Zod validation for all env vars
- No hardcoded secrets in code
- Use `.env.example` for documentation

## API Security

- Always verify LINE webhook signatures
- Use rate limiting on all endpoints
- Implement helmet.js security headers
- Trust proxy settings for production

## Data Validation

- Validate all external inputs with Zod
- Sanitize user messages before processing
- Use parameterized queries (Prisma handles this)
- Never trust client data

## Error Messages

- Don't expose stack traces in production
- Log sensitive errors server-side only
- Return generic errors to clients
- Use structured logging with Winston
