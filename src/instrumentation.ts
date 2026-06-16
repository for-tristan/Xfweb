import { ensureMigrations } from '@/lib/db';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Running database migrations...');
    await ensureMigrations();
    console.log('[Instrumentation] Migrations complete, app ready.');
  }
}
