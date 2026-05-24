-- Run this SQL in your Turso dashboard to create the test system tables
-- IMPORTANT: Drop existing test tables first (they have wrong column casing)
-- Prisma's libsql adapter requires lowercase column names

DROP TABLE IF EXISTS TestUnlock;
DROP TABLE IF EXISTS TestAttempt;
DROP TABLE IF EXISTS TestQuestion;
DROP TABLE IF EXISTS ModuleTest;

CREATE TABLE ModuleTest (
  id TEXT NOT NULL PRIMARY KEY,
  moduleid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  timelimit INTEGER NOT NULL DEFAULT 30,
  passingscore INTEGER NOT NULL DEFAULT 70,
  createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat DATETIME NOT NULL,
  CONSTRAINT ModuleTest_moduleid_fkey FOREIGN KEY (moduleid) REFERENCES CourseModule(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE TestQuestion (
  id TEXT NOT NULL PRIMARY KEY,
  testid TEXT NOT NULL,
  questiontext TEXT NOT NULL,
  questiontype TEXT NOT NULL DEFAULT 'multiple_choice',
  options TEXT NOT NULL DEFAULT '[]',
  correctanswer INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 1,
  questionorder INTEGER NOT NULL DEFAULT 0,
  createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT TestQuestion_testid_fkey FOREIGN KEY (testid) REFERENCES ModuleTest(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE TestAttempt (
  id TEXT NOT NULL PRIMARY KEY,
  testid TEXT NOT NULL,
  userid TEXT NOT NULL,
  answers TEXT NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  totalpoints INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  startedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submittedat DATETIME,
  createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT TestAttempt_testid_fkey FOREIGN KEY (testid) REFERENCES ModuleTest(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT TestAttempt_userid_fkey FOREIGN KEY (userid) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE TestUnlock (
  id TEXT NOT NULL PRIMARY KEY,
  testid TEXT NOT NULL,
  userid TEXT NOT NULL,
  unlockedby TEXT NOT NULL,
  createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT TestUnlock_testid_fkey FOREIGN KEY (testid) REFERENCES ModuleTest(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT TestUnlock_userid_fkey FOREIGN KEY (userid) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unique constraints (one attempt per student per test, one unlock per student per test)
CREATE UNIQUE INDEX TestAttempt_testid_userid_key ON TestAttempt(testid, userid);
CREATE UNIQUE INDEX TestUnlock_testid_userid_key ON TestUnlock(testid, userid);
