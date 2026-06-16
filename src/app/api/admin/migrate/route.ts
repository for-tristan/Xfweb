import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@libsql/client';


async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return { error: 'DATABASE_URL not configured' };
  }

  const client = createClient({ url });

  const results: { sql: string; status: string; error?: string }[] = [];

  const migrations = [
    `ALTER TABLE "ModuleTest" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';`,
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      results.push({ sql, status: 'ok' });
    } catch (err: any) {
      if (err?.message?.includes('duplicate column') || err?.message?.includes('already exists')) {
        results.push({ sql, status: 'already_exists' });
      } else {
        results.push({ sql, status: 'error', error: err?.message || String(err) });
      }
    }
  }

  return { results };
}

// NOTE: This endpoint mutates the database schema and must NOT be exposed via GET.
// GET requests can be triggered by browsers prefetching links, by <img> tags,
// or by CSRF-style navigation — none of which we want running migrations.
// Use POST (admin-gated) to run migrations intentionally.
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
