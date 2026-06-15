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

    // Helper: add a column if it doesn't exist (idempotent)
    const addColumn = async (table: string, column: string, definition: string) => {
      try {
        await client.execute(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
        console.log(`[Migration] Added ${table}.${column}`);
      } catch (err: any) {
        if (err?.message?.includes('duplicate column') || err?.message?.includes('already exists')) {
          // Column already exists — nothing to do
        } else {
          console.error(`[Migration] Failed to add ${table}.${column}:`, err?.message || err);
        }
      }
    };

    // Helper: create a table if it doesn't exist (idempotent)
    const createTable = async (table: string, ddl: string) => {
      try {
        await client.execute(`CREATE TABLE IF NOT EXISTS "${table}" (${ddl})`);
        console.log(`[Migration] Table ${table} ready`);
      } catch (err: any) {
        console.error(`[Migration] Table ${table} creation:`, err?.message || err);
      }
    };

    // ── User table columns ──────────────────────────────────────────────
    await addColumn('User', 'username', 'TEXT');
    await addColumn('User', 'avatar', 'TEXT');
    await addColumn('User', 'bio', 'TEXT');
    await addColumn('User', 'emailVerified', 'DATETIME');

    // ── Course table columns ────────────────────────────────────────────
    await addColumn('Course', 'instructorId', 'TEXT');

    // ── ModuleTest table columns ────────────────────────────────────────
    await addColumn('ModuleTest', 'status', "TEXT NOT NULL DEFAULT 'active'");

    // ── TestAttempt table columns ───────────────────────────────────────
    await addColumn('TestAttempt', 'startedat', "TEXT NOT NULL DEFAULT '{}'");

    // ── CourseModule table columns ──────────────────────────────────────
    await addColumn('CourseModule', 'content', "TEXT NOT NULL DEFAULT ''");

    // ── Create missing tables ───────────────────────────────────────────
    // These use CREATE TABLE IF NOT EXISTS so they're safe if the table exists

    await createTable('Project', `
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
    `);

    await createTable('Session', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('SiteSetting', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "key" TEXT NOT NULL UNIQUE,
      "value" TEXT NOT NULL DEFAULT ''
    `);

    await createTable('EmailVerification', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "email" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('AccountLink', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('PasswordReset', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "email" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('CourseProgress', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "courseId" TEXT NOT NULL,
      "courseName" TEXT NOT NULL,
      "completedModules" TEXT NOT NULL DEFAULT '[]',
      "lastAccessed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('StudySession', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "courseId" TEXT NOT NULL,
      "duration" INTEGER NOT NULL DEFAULT 0,
      "date" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('Friendship', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "senderId" TEXT NOT NULL,
      "receiverId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('ChatMessage', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "senderId" TEXT NOT NULL,
      "receiverId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "read" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('GameScore', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "game" TEXT NOT NULL,
      "language" TEXT NOT NULL,
      "difficulty" TEXT NOT NULL,
      "score" INTEGER NOT NULL,
      "correct" INTEGER NOT NULL,
      "total" INTEGER NOT NULL,
      "timeSpent" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('AiConversation', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL DEFAULT 'New Chat',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('AiMessage', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "conversationId" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('ModuleUnlock', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "moduleId" TEXT NOT NULL,
      "unlockedBy" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('ModuleStudy', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "moduleId" TEXT NOT NULL,
      "timeSpent" INTEGER NOT NULL DEFAULT 0,
      "studied" BOOLEAN NOT NULL DEFAULT false,
      "lastStudied" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('Certificate', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "courseId" TEXT NOT NULL,
      "courseName" TEXT NOT NULL,
      "certificateId" TEXT NOT NULL UNIQUE,
      "completionDate" TEXT NOT NULL,
      "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    // ── Create missing indexes (idempotent) ─────────────────────────────
    const createIndex = async (name: string, sql: string) => {
      try {
        await client.execute(`CREATE INDEX IF NOT EXISTS "${name}" ON ${sql}`);
      } catch (err: any) {
        // Index might already exist, that's fine
      }
    };

    await createIndex('Session_token_key', '"Session"("token")');
    await createIndex('Session_userId_idx', '"Session"("userId")');
    await createIndex('Session_expiresAt_idx', '"Session"("expiresAt")');
    await createIndex('Enrollment_userId_courseId_key', '"Enrollment"("userId", "courseId")');
    await createIndex('Enrollment_courseId_idx', '"Enrollment"("courseId")');
    await createIndex('Enrollment_status_idx', '"Enrollment"("status")');
    await createIndex('QuoteRequest_status_idx', '"QuoteRequest"("status")');
    await createIndex('AccountLink_provider_providerAccountId_key', '"AccountLink"("provider", "providerAccountId")');
    await createIndex('CourseProgress_userId_courseId_key', '"CourseProgress"("userId", "courseId")');
    await createIndex('StudySession_userId_courseId_date_key', '"StudySession"("userId", "courseId", "date")');
    await createIndex('Friendship_senderId_receiverId_key', '"Friendship"("senderId", "receiverId")');
    await createIndex('ChatMessage_senderId_receiverId_idx', '"ChatMessage"("senderId", "receiverId")');
    await createIndex('ChatMessage_receiverId_senderId_idx', '"ChatMessage"("receiverId", "senderId")');
    await createIndex('GameScore_game_idx', '"GameScore"("game")');
    await createIndex('GameScore_userId_idx', '"GameScore"("userId")');
    await createIndex('GameScore_score_idx', '"GameScore"("score")');
    await createIndex('AiConversation_userId_idx', '"AiConversation"("userId")');
    await createIndex('AiConversation_updatedAt_idx', '"AiConversation"("updatedAt")');
    await createIndex('AiMessage_conversationId_idx', '"AiMessage"("conversationId")');
    await createIndex('AiMessage_createdAt_idx', '"AiMessage"("createdAt")');
    await createIndex('ModuleUnlock_userId_moduleId_key', '"ModuleUnlock"("userId", "moduleId")');
    await createIndex('ModuleStudy_userId_moduleId_key', '"ModuleStudy"("userId", "moduleId")');
    await createIndex('Certificate_userId_courseId_key', '"Certificate"("userId", "courseId")');
    await createIndex('EmailVerification_email_code_used_idx', '"EmailVerification"("email", "code", "used")');
    await createIndex('EmailVerification_expiresAt_idx', '"EmailVerification"("expiresAt")');
    await createIndex('PasswordReset_email_code_used_idx', '"PasswordReset"("email", "code", "used")');
    await createIndex('PasswordReset_expiresAt_idx', '"PasswordReset"("expiresAt")');
    await createIndex('TestAttempt_testId_userId_key', '"TestAttempt"("testid", "userid")');
    await createIndex('TestUnlock_testId_userId_key', '"TestUnlock"("testid", "userid")');

    // ── Create missing test tables (with lowercase columns for libSQL) ──
    await createTable('ModuleTest', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "moduleid" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'active',
      "timelimit" INTEGER NOT NULL DEFAULT 30,
      "passingscore" INTEGER NOT NULL DEFAULT 70,
      "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('TestQuestion', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "testid" TEXT NOT NULL,
      "questiontext" TEXT NOT NULL,
      "questiontype" TEXT NOT NULL DEFAULT 'multiple_choice',
      "options" TEXT NOT NULL DEFAULT '[]',
      "correctanswer" INTEGER NOT NULL DEFAULT 0,
      "points" INTEGER NOT NULL DEFAULT 1,
      "questionorder" INTEGER NOT NULL DEFAULT 0,
      "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('TestAttempt', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "testid" TEXT NOT NULL,
      "userid" TEXT NOT NULL,
      "answers" TEXT NOT NULL DEFAULT '{}',
      "score" INTEGER NOT NULL DEFAULT 0,
      "totalpoints" INTEGER NOT NULL DEFAULT 0,
      "passed" BOOLEAN NOT NULL DEFAULT false,
      "startedat" TEXT NOT NULL DEFAULT '{}',
      "submittedat" DATETIME,
      "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await createTable('TestUnlock', `
      "id" TEXT PRIMARY KEY NOT NULL,
      "testid" TEXT NOT NULL,
      "userid" TEXT NOT NULL,
      "unlockedby" TEXT NOT NULL,
      "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    console.log('[Migration] Auto-migration complete');
  } catch (err) {
    console.error('[Migration] Auto-migration failed:', err);
  }
}

// Run migrations on first import (cold start)
ensureMigrations().catch(() => {});
