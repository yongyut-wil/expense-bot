import { PrismaClient } from "../generated/prisma/client";
import { logger } from "../utils/logger";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../config";

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
    ],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// warn ถ้า query ช้าเกิน 500ms
if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    if (e.duration > 500) {
      logger.warn("Slow query detected", {
        query: e.query,
        duration: `${e.duration}ms`,
      });
    }
  });
}

prisma.$on("error", (e) => {
  logger.error("Prisma error", { message: e.message });
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}