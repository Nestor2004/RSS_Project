import { z } from "zod";

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Database
  MONGODB_URI: z
    .string()
    .optional()
    .default("mongodb://localhost:27017/rss_project"),

  // ChromaDB
  CHROMADB_URL: z.string().optional().default("http://localhost:8000"),
  CHROMA_DB_PATH: z.string().optional().default("http://localhost:8000"),
  CHROMA_SERVER_CORS_ALLOW_ORIGINS: z.string().optional().default("*"),
  // ChromaDB Cloud
  CHROMA_CLOUD_TOKEN: z.string().optional(),
  CHROMA_TENANT_ID: z.string().optional(),
  CHROMA_DATABASE: z.string().optional(),

  // OpenAI (optional)
  OPENAI_API_KEY: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Validate environment variables
 */
export function validateEnv() {
  try {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      console.error(
        "❌ Invalid environment variables:",
        parsed.error.flatten().fieldErrors
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error validating environment variables:", error);
    return false;
  }
}

/**
 * Get validated environment variables
 */
export function getEnv() {
  return envSchema.parse(process.env);
}

// Validate environment variables on module load
validateEnv();
