---
trigger: always_on
---

# TypeScript Standards for Expense Bot

## Type Safety

- Never use `any` type - prefer `unknown` or proper typing
- All functions must have explicit return types
- Use strict TypeScript configuration
- Prefer `interface` for object shapes, `type` for unions/intersections

## Code Organization

- One class/interface per file
- Barrel exports in index.ts files
- Group related types in `types/` directory

## Naming Conventions

- Use PascalCase for classes, interfaces, types
- Use camelCase for variables, functions
- Use UPPER_CASE for constants
- Prefix interfaces with descriptive names (no 'I' prefix)

## Error Handling

- Use custom error classes from `utils/errors.ts`
- Never swallow errors silently
- Log errors with structured data using Winston
