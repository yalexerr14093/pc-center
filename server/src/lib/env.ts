import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  // Can be a single origin or comma-separated list (for dev when Vite port changes)
  CLIENT_ORIGIN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().optional()
});

export const env = envSchema.parse(process.env);

