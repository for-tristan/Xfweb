import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null };
  }
  if (user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

const SENSITIVE_KEY_PATTERNS = [
  'smtp_pass', 'secret', 'api_key', 'token', 'password',
  'database_url', 'session_secret', 'private_key',
  'google_secret', 'github_secret', 'cloudinary_api_secret',
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some(pattern => lower.includes(pattern));
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const settings = await db.siteSetting.findMany();

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      if (isSensitiveKey(setting.key)) {
        const val = setting.value;
        settingsMap[setting.key] = val.length > 4 ? '••••' + val.slice(-4) : '••••';
      } else {
        settingsMap[setting.key] = setting.value;
      }
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Admin settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const updates = body;

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'A non-empty settings object is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        db.siteSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    const settingsMap: Record<string, string> = {};
    for (const setting of results) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
