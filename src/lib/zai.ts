

interface ZAIConfig {
  baseUrl: string;
  apiKey: string;
  chatId?: string;
  userId?: string;
  token?: string;
}


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


export async function createZAI(): Promise<any> {
  const envConfig = configFromEnv();

  if (envConfig) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    return new (ZAI as any)(envConfig);
  }

  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  return ZAI.create();
}
