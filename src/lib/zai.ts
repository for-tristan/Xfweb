/**
 * ZAI SDK helper that works in both local dev and deployment.
 *
 * Priority:
 *  1. Environment variables (ZAI_BASE_URL, ZAI_API_KEY, …)
 *  2. File-based .z-ai-config via ZAI.create() (local dev only)
 *
 * In deployment platforms the .z-ai-config file is absent (gitignored),
 * so env vars are the only reliable source.
 */

interface ZAIConfig {
  baseUrl: string;
  apiKey: string;
  chatId?: string;
  userId?: string;
  token?: string;
}

/**
 * Build a ZAI config from environment variables.
 * Returns null if required keys are missing.
 */
function configFromEnv(): ZAIConfig | null {
  const baseUrl = process.env.ZAI_BASE_URL;
  const apiKey = process.env.ZAI_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return {
    baseUrl,
    apiKey,
    chatId: process.env.ZAI_CHAT_ID,
    userId: process.env.ZAI_USER_ID,
    token: process.env.ZAI_TOKEN,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Create a ZAI instance using env vars first, then falling back to the
 * SDK's built-in file-based config loader (.z-ai-config).
 */
export async function createZAI(): Promise<any> {
  const envConfig = configFromEnv();

  if (envConfig) {
    // Bypass loadConfig() — construct directly with env-var config.
    // The SDK's constructor is private in TS but works fine at runtime.
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    return new (ZAI as any)(envConfig);
  }

  // Fallback: let the SDK read .z-ai-config from disk (local dev)
  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  return ZAI.create();
}
