import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/__tests__/**",
    "!src/generated/**",
    "!src/index.ts",
    "!src/app.ts",
    "!src/db/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    "^@line/bot-sdk$": "<rootDir>/src/__tests__/__mocks__/line.ts",
    "^@google/generative-ai$": "<rootDir>/src/__tests__/__mocks__/google.ts",
    "^../db/prisma$": "<rootDir>/src/__tests__/__mocks__/prisma.ts",
    "^../../db/prisma$": "<rootDir>/src/__tests__/__mocks__/prisma.ts",
  },
};

export default config;
