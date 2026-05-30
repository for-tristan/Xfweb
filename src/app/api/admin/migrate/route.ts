import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@libsql/client';

/**
 * One-time migration endpoint to sync the Turso database schema.
 * Run this after deploying schema changes that Prisma db push can't
 * apply to remote Turso (since prisma migrate doesn't work with libSQL).
 *
 * GET or POST /api/admin/migrate
 * Authorization: admin only
 *
 * Each migration statement is idempotent — safe to run multiple times.
 */
async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return { error: 'DATABASE_URL not configured' };
  }

  const client = createClient({ url });

  const results: { sql: string; status: string; error?: string }[] = [];

  // Migration statements — each is idempotent (errors gracefully if already applied)
  const migrations = [
    // Add status column to ModuleTest if it doesn't exist
    `ALTER TABLE "ModuleTest" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';`,
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      results.push({ sql, status: 'ok' });
    } catch (err: any) {
      // SQLite error: "duplicate column name" means it already exists — that's fine
      if (err?.message?.includes('duplicate column') || err?.message?.includes('already exists')) {
        results.push({ sql, status: 'already_exists' });
      } else {
        results.push({ sql, status: 'error', error: err?.message || String(err) });
      }
    }
  }

  return { results };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const result = await runMigrations();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const result = await runMigrations();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    );
  }
}
