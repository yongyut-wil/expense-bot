---
trigger: glob
globs: "**/*.test.ts,**/__tests__/**"
---

# Testing Standards

## Test Structure

- Use `describe` blocks for grouping related tests
- Use `it` or `test` for individual test cases
- Follow AAA pattern: Arrange, Act, Assert
- One assertion concept per test

## Mocking

- Mock external dependencies (Prisma, LINE, AI)
- Use Jest's mock functions
- Clear mocks between tests
- Mock at the module level, not implementation

## Coverage Goals

- Aim for >80% code coverage
- Test happy paths and error cases
- Test edge cases and validation
- Don't test third-party libraries

## Example Structure

```typescript
describe("ServiceName", () => {
  describe("methodName", () => {
    it("should handle valid input", () => {
      // Arrange
      const input = { ... };

      // Act
      const result = method(input);

      // Assert
      expect(result).toEqual({ ... });
    });

    it("should throw error for invalid input", () => {
      expect(() => method(invalid)).toThrow(ValidationError);
    });
  });
});
```
