import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Keys that should never be exposed to the public
const SENSITIVE_SETTING_KEYS = [
  'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass',
  'secret', 'api_key', 'apikey', 'token', 'password',
  'database_url', 'session_secret', 'private_key',
  'google_id', 'google_secret', 'github_id', 'github_secret',
];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_SETTING_KEYS.some(s => key.toLowerCase().includes(s));
}

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany();

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      // SECURITY: Filter out sensitive settings from public endpoint
      if (!isSensitiveKey(setting.key)) {
        settingsMap[setting.key] = setting.value;
      }
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Public settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
