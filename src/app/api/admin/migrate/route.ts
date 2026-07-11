import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@libsql/client';
import { logRequest } from '@/lib/activityLog';


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
    const { error, user } = await requireAdmin();
    if (error) return error;

    const result = await runMigrations();
    await logRequest(request, 'ADMIN_MIGRATE', {
      userId: user?.id,
      email: user?.email,
      details: `Ran DB migrations: ${result.results?.length || 0} statement(s); statuses=${result.results?.map((r: any) => r.status).join(',') || 'n/a'}`,
      status: 200,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    );
  }
}
