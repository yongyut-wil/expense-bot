import { createApp } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { prisma } from "./db/prisma";

async function main() {
  // ตรวจสอบ database connection ก่อน start
  await prisma.$connect();
  logger.info("Database connected ✅");

  const app = createApp();

  const server = app.listen(config.PORT, () => {
    logger.info("Server running 🚀", {
      port: config.PORT,
      env: config.NODE_ENV,
    });
  });

  // Graceful shutdown — รอ request ที่ค้างอยู่เสร็จก่อน
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // จัดการ error ที่ไม่ได้ handle ไว้
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { reason });
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});