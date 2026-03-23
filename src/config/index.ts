import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  LINE_CHANNEL_SECRET: z.string().min(1, "LINE_CHANNEL_SECRET is required"),
  LINE_CHANNEL_ACCESS_TOKEN: z
    .string()
    .min(1, "LINE_CHANNEL_ACCESS_TOKEN is required"),
  
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  AI_PROVIDER: z
    .enum(["google", "openai"])
    .default("google"),

  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;