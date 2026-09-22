-- ============================================================
-- Contribution Tracker – Database Schema (v3: Multi-Project)
-- ============================================================

-- ------------------------------------------------------------
-- SECTION A: Fresh Database Setup (Destructive)
-- ⚠️  Only use this for clean installs / resetting your database.
-- ------------------------------------------------------------

-- 1. Drop old tables (order matters for FK dependencies)
DROP TABLE IF EXISTS contribution_votes CASCADE;
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Users table (GitHub-backed, global user account)
CREATE TABLE users (
  id                  SERIAL PRIMARY KEY,
  github_id           TEXT UNIQUE NOT NULL,
  github_username     TEXT NOT NULL,
  avatar_url          TEXT,
  github_access_token TEXT
);

-- 3. Projects table
CREATE TABLE projects (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  leader_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  repo_owner  TEXT,
  repo_name   TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Project Members join table (Many-to-Many: Users <-> Projects)
CREATE TABLE project_members (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

-- 5. Contributions table (Scoped directly to project and user)
CREATE TABLE contributions (
  id              SERIAL PRIMARY KEY,
  project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source          TEXT    NOT NULL DEFAULT 'manual',
  category        TEXT    NOT NULL,
  description     TEXT    NOT NULL,
  time_estimate   REAL    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'pending',
  commit_sha      TEXT,
  commit_url      TEXT,
  attachment_url  TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  attachment_type TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Unique index to prevent duplicate commit syncs for a project
CREATE UNIQUE INDEX uq_project_commit ON contributions (project_id, commit_sha) WHERE commit_sha IS NOT NULL;

-- 6. Contribution Votes table (Peer review & verification)
CREATE TABLE contribution_votes (
  id              SERIAL PRIMARY KEY,
  contribution_id INTEGER NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote            TEXT NOT NULL CHECK (vote IN ('approve', 'flag')),
  comment         TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_contribution_user_vote UNIQUE (contribution_id, user_id)
);

-- ============================================================
-- SECTION B: In-Place Migration Script (v2 -> v3)
-- Run these statements manually on an existing Postgres database
-- to preserve existing users, projects, and contributions.
-- ============================================================

/*
-- 1. Create project_members join table
CREATE TABLE IF NOT EXISTS project_members (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

-- 2. Migrate existing user project assignments & roles into project_members
INSERT INTO project_members (project_id, user_id, role)
SELECT project_id, id, COALESCE(role, 'member')
FROM users
WHERE project_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 3. Add project_id column to contributions table
ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

-- 4. Populate project_id for existing contributions from users table
UPDATE contributions c
SET project_id = u.project_id
FROM users u
WHERE c.user_id = u.id AND c.project_id IS NULL;

-- 5. Remove any orphan contributions without a project and enforce NOT NULL
DELETE FROM contributions WHERE project_id IS NULL;
ALTER TABLE contributions ALTER COLUMN project_id SET NOT NULL;

-- 6. Drop deprecated single-project columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS project_id;
ALTER TABLE users DROP COLUMN IF EXISTS role;
*/

-- ============================================================
-- SECTION C: In-Place Migration Script (v3 -> v4: GitHub Integration)
-- Run these statements manually on your local Postgres database
-- to add support for the GitHub integration schema changes.
-- ============================================================

-- 1. Add repository tracking columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_owner TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_name TEXT;

-- 2. Add commit tracking columns to contributions table
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS commit_sha TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS commit_url TEXT;

-- 3. Create unique index to prevent duplicate commit logs per project
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_commit ON contributions (project_id, commit_sha) WHERE commit_sha IS NOT NULL;

-- ============================================================
-- SECTION D: In-Place Migration Script (v4 -> v5: Attachments & Peer Voting)
-- Run these statements manually on your Postgres database
-- to add support for file attachments and peer verification votes.
-- ============================================================

-- 1. Add attachment columns to contributions table
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- 2. Create contribution_votes table for peer verification
CREATE TABLE IF NOT EXISTS contribution_votes (
  id              SERIAL PRIMARY KEY,
  contribution_id INTEGER NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote            TEXT NOT NULL CHECK (vote IN ('approve', 'flag')),
  comment         TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_contribution_user_vote UNIQUE (contribution_id, user_id)
);

