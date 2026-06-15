import { ensureMigrations } from '@/lib/db';

export async function register() {
  // This runs once on server cold start, BEFORE any requests are served.
  // It ensures the Turso database schema is in sync with our Prisma schema.
  // Without this, the fire-and-forget call in db.ts can race with incoming requests.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Running database migrations...');
    await ensureMigrations();
    console.log('[Instrumentation] Migrations complete, app ready.');
  }
}
