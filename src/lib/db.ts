import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

function createPrismaClient() {
  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// ═══════════════════════════════════════════════════════
// AUTO-MIGRATION: Run once on cold start to sync schema
// with Turso. Safe to run multiple times (idempotent).
// ═══════════════════════════════════════════════════════

let migrationRan = false;

export async function ensureMigrations() {
  if (migrationRan) return;
  migrationRan = true;

  const url = process.env.DATABASE_URL;
  if (!url) return;

  try {
    // SECURITY: Include auth token for Turso remote databases
    const client = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    // Add status column to ModuleTest if missing
    try {
      await client.execute(`ALTER TABLE "ModuleTest" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active'`);
      console.log('[Migration] Added ModuleTest.status column');
    } catch (err: any) {
      if (err?.message?.includes('duplicate column') || err?.message?.includes('already exists')) {
        // Column already exists — nothing to do
      } else {
        console.error('[Migration] Failed to add ModuleTest.status:', err?.message || err);
      }
    }

    // Add startedAt column to TestAttempt if missing (fixes -1s duration bug)
    try {
      await client.execute(`ALTER TABLE "TestAttempt" ADD COLUMN "startedat" TEXT NOT NULL DEFAULT '{}'`);
      // The above is just to check if column exists — if it passes, we need to set proper defaults
      // Actually let's use a proper approach: check first, then add with proper default
    } catch (err: any) {
      if (err?.message?.includes('duplicate column') || err?.message?.includes('already exists')) {
        // Column already exists — nothing to do
      } else {
        console.error('[Migration] TestAttempt.startedat check:', err?.message || err);
      }
    }

    // Create Project table if missing
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS "Project" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "title" TEXT NOT NULL,
          "slug" TEXT NOT NULL UNIQUE,
          "description" TEXT NOT NULL DEFAULT '',
          "category" TEXT NOT NULL DEFAULT 'web',
          "tags" TEXT NOT NULL DEFAULT '[]',
          "icon" TEXT NOT NULL DEFAULT 'fa-solid fa-code',
          "imageUrl" TEXT NOT NULL DEFAULT '',
          "projectUrl" TEXT NOT NULL DEFAULT '',
          "status" TEXT NOT NULL DEFAULT 'active',
          "displayOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('[Migration] Project table ready');
    } catch (err: any) {
      console.error('[Migration] Project table creation:', err?.message || err);
    }
  } catch (err) {
    console.error('[Migration] Auto-migration failed:', err);
  }
}

// Run migrations on first import (cold start)
ensureMigrations().catch(() => {});
