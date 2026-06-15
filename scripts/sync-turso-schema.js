#!/usr/bin/env node
/**
 * Sync Turso Schema
 * 
 * Run this script to push the full Prisma schema to your Turso database.
 * It uses the same libsql client that your app uses, so it works with
 * Turso's auth tokens.
 * 
 * Usage:
 *   DATABASE_URL="libsql://your-db-name.turso.io" \
 *   DATABASE_AUTH_TOKEN="your-auth-token" \
 *   node scripts/sync-turso-schema.js
 * 
 * Or set the env vars in a .env.turso file and source it first.
 */

const { createClient } = require('@libsql/client');

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!url || url.startsWith('file:')) {
    console.error('ERROR: Set DATABASE_URL to your Turso URL (libsql://...turso.io)');
    console.error('  Example: DATABASE_URL="libsql://mydb.turso.io" DATABASE_AUTH_TOKEN="xxx" node scripts/sync-turso-schema.js');
    process.exit(1);
  }

  console.log(`Connecting to: ${url}`);

  const client = createClient({ url, authToken });

  // ── Helper: add column if missing (idempotent) ──────────────────────
  const addColumn = async (table, column, definition) => {
    try {
      await client.execute(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
      console.log(`  ✅ Added ${table}.${column}`);
    } catch (err) {
      if (err?.message?.includes('duplicate column') || err?.message?.includes('already exists')) {
        console.log(`  ⏭️  ${table}.${column} already exists`);
      } else {
        console.error(`  ❌ Failed ${table}.${column}:`, err?.message || err);
      }
    }
  };

  // ── Helper: create table if missing ─────────────────────────────────
  const createTable = async (table, ddl) => {
    try {
      await client.execute(`CREATE TABLE IF NOT EXISTS "${table}" (${ddl})`);
      console.log(`  ✅ Table ${table} ready`);
    } catch (err) {
      console.error(`  ❌ Table ${table}:`, err?.message || err);
    }
  };

  // ── Helper: create index if missing ─────────────────────────────────
  const createIndex = async (name, sql) => {
    try {
      await client.execute(`CREATE INDEX IF NOT EXISTS "${name}" ON ${sql}`);
      console.log(`  ✅ Index ${name} ready`);
    } catch (err) {
      console.error(`  ❌ Index ${name}:`, err?.message || err);
    }
  };

  console.log('\n── Adding missing columns ────────────────────────────');

  // ── Course table ────────────────────────────────────────────────────
  await addColumn('Course', 'instructorId', 'TEXT');
  await addColumn('Course', 'description', "TEXT NOT NULL DEFAULT ''");
  await addColumn('Course', 'level', "TEXT NOT NULL DEFAULT 'Beginner'");
  await addColumn('Course', 'duration', "TEXT NOT NULL DEFAULT '4 Weeks'");
  await addColumn('Course', 'price', "TEXT NOT NULL DEFAULT 'Free'");
  await addColumn('Course', 'status', "TEXT NOT NULL DEFAULT 'active'");
  await addColumn('Course', 'icon', "TEXT NOT NULL DEFAULT 'fas fa-graduation-cap'");
  await addColumn('Course', 'features', "TEXT NOT NULL DEFAULT '[]'");
  await addColumn('Course', 'prerequisites', "TEXT NOT NULL DEFAULT ''");
  await addColumn('Course', 'displayOrder', 'INTEGER NOT NULL DEFAULT 0');
  await addColumn('Course', 'techStack', "TEXT NOT NULL DEFAULT ''");

  // ── User table ──────────────────────────────────────────────────────
  await addColumn('User', 'username', 'TEXT');
  await addColumn('User', 'phone', 'TEXT');
  await addColumn('User', 'company', 'TEXT');
  await addColumn('User', 'avatar', 'TEXT');
  await addColumn('User', 'bio', 'TEXT');
  await addColumn('User', 'role', "TEXT NOT NULL DEFAULT 'student'");
  await addColumn('User', 'emailVerified', 'DATETIME');

  // ── CourseModule table ──────────────────────────────────────────────
  await addColumn('CourseModule', 'content', "TEXT NOT NULL DEFAULT ''");

  // ── ModuleTest table ────────────────────────────────────────────────
  await addColumn('ModuleTest', 'status', "TEXT NOT NULL DEFAULT 'active'");

  // ── TestAttempt table ───────────────────────────────────────────────
  await addColumn('TestAttempt', 'startedat', "TEXT NOT NULL DEFAULT '{}'");

  console.log('\n── Creating missing tables ───────────────────────────');

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

  console.log('\n── Creating missing indexes ──────────────────────────');

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

  // ── Verify: check Course table has instructorId ─────────────────────
  console.log('\n── Verifying Course table schema ─────────────────────');
  const courseSchema = await client.execute("PRAGMA table_info('Course')");
  const columns = courseSchema.rows.map(r => r.name);
  console.log('Course columns:', columns.join(', '));
  
  if (columns.includes('instructorId')) {
    console.log('\n✅ instructorId column exists on Course table!');
  } else {
    console.log('\n❌ instructorId column still missing on Course table!');
  }

  console.log('\n── Sync complete! ────────────────────────────────────');
  
  client.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
