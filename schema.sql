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
  id                    SERIAL PRIMARY KEY,
  github_id             TEXT UNIQUE,
  google_id             TEXT UNIQUE,
  user_type             TEXT NOT NULL DEFAULT 'student',
  github_username       TEXT NOT NULL,
  display_name          TEXT,
  avatar_url            TEXT,
  github_access_token   TEXT,
  google_access_token   TEXT,
  google_refresh_token  TEXT,
  google_token_expiry   BIGINT
);

-- 3. Projects table
CREATE TABLE projects (
  id                   SERIAL PRIMARY KEY,
  name                 TEXT NOT NULL,
  invite_code          TEXT UNIQUE NOT NULL,
  faculty_invite_code  TEXT UNIQUE,
  leader_id            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  repo_owner           TEXT,
  repo_name            TEXT,
  google_folder_id     TEXT,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW()
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
  doc_id          TEXT,
  doc_url         TEXT,
  word_count      INTEGER,
  attachment_url  TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  attachment_type TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Unique indexes to prevent duplicate commit/doc syncs for a project
CREATE UNIQUE INDEX uq_project_commit ON contributions (project_id, commit_sha) WHERE commit_sha IS NOT NULL;
CREATE UNIQUE INDEX uq_project_doc ON contributions (project_id, doc_id) WHERE doc_id IS NOT NULL;

-- 5b. Multi-file attachments per contribution (the legacy attachment_*
-- columns above still hold the first file for backward compatibility)
CREATE TABLE contribution_attachments (
  id              SERIAL PRIMARY KEY,
  contribution_id INTEGER NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  name            TEXT,
  size            INTEGER,
  type            TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contribution_attachments_contribution ON contribution_attachments (contribution_id);

-- Indexes for the hot filter/join columns used by dashboard, reports, and
-- peer-verification queries (WHERE project_id = ..., GROUP BY status/category,
-- JOIN c.user_id = u.id AND c.project_id = pm.project_id).
CREATE INDEX idx_contributions_project_user ON contributions (project_id, user_id);
CREATE INDEX idx_contributions_project_status ON contributions (project_id, status);
CREATE INDEX idx_contributions_project_category ON contributions (project_id, category);
CREATE INDEX idx_project_members_project ON project_members (project_id);
CREATE INDEX idx_project_members_user ON project_members (user_id);

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

-- ============================================================
-- SECTION E: In-Place Migration Script (v5 -> v6: Performance Indexes)
-- Run these statements manually on your Postgres database to speed up
-- dashboard/reports/peer-verification queries on larger datasets.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_contributions_project_user ON contributions (project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_project_status ON contributions (project_id, status);
CREATE INDEX IF NOT EXISTS idx_contributions_project_category ON contributions (project_id, category);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members (user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_votes_contribution ON contribution_votes (contribution_id);

-- ============================================================
-- SECTION F: In-Place Migration Script (v6 -> v7: Google Drive/Docs Integration)
-- Applied automatically by lib/db.js's ensureSchema() on first use — these
-- statements are also listed here for reference / manual application.
-- ============================================================

-- 1. Google OAuth tokens live on the connecting user (mirrors github_access_token)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT;

-- 2. A project points at one Google Drive folder to sync Docs from
ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_folder_id TEXT;

-- 3. Synced docs get an identifying id/url pair (mirrors commit_sha/commit_url)
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS doc_id TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS doc_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_doc ON contributions (project_id, doc_id) WHERE doc_id IS NOT NULL;

-- 4. Word count captured at sync time (for the Reports scoring system)
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS word_count INTEGER;

-- ============================================================
-- SECTION G: In-Place Migration Script (v7 -> v8: Voting Ties)
-- No schema change needed — 'contested' is just a new value for the
-- existing unconstrained `contributions.status` TEXT column, and the
-- eligible-voter majority calculation reads project_members directly.
-- Listed here only for the version history.
-- ============================================================

-- ============================================================
-- SECTION H: In-Place Migration Script (v8 -> v9: Role-Based Access)
-- Applied automatically by lib/db.js's ensureSchema() on first use — these
-- statements are also listed here for reference / manual application.
-- Adds a Student vs Faculty role. Students are unaffected (still GitHub
-- login, still project_members). Faculty log in with Google, are never
-- inserted into project_members, and supervise projects through the new
-- project_faculty join table instead.
-- ============================================================

-- 1. github_id becomes optional (faculty rows never have one); Google
--    identity + a global role marker are added to the same users table.
ALTER TABLE users ALTER COLUMN github_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'student';

-- 2. A second, faculty-only invite code per project.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS faculty_invite_code TEXT UNIQUE;

-- 3. Faculty supervise projects via their own join table (never
--    project_members, so they never appear in student rosters/reports).
CREATE TABLE IF NOT EXISTS project_faculty (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_faculty UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_faculty_project ON project_faculty (project_id);
CREATE INDEX IF NOT EXISTS idx_project_faculty_user ON project_faculty (user_id);

-- 4. Faculty remarks on a contribution — separate from contribution_votes,
--    never counted toward the approve/flag majority or the score formula.
CREATE TABLE IF NOT EXISTS contribution_remarks (
  id              SERIAL PRIMARY KEY,
  contribution_id INTEGER NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  faculty_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  remark          TEXT NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contribution_remarks_contribution ON contribution_remarks (contribution_id);

-- 5. Backfill a faculty invite code for projects created before this
--    column existed (new projects get one at creation time instead).
UPDATE projects
SET faculty_invite_code = UPPER(SUBSTRING(MD5(id::text || random()::text || clock_timestamp()::text) FOR 8))
WHERE faculty_invite_code IS NULL;

-- ============================================================
-- SECTION I: In-Place Migration Script (v9 -> v10: Editable Display Name)
-- Applied automatically by lib/db.js's ensureSchema() on first use.
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ============================================================
-- SECTION J: In-Place Migration Script (v10 -> v11: Multi-File Attachments)
-- Applied automatically by lib/db.js's ensureSchema() on first use.
-- ============================================================
CREATE TABLE IF NOT EXISTS contribution_attachments (
  id              SERIAL PRIMARY KEY,
  contribution_id INTEGER NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  name            TEXT,
  size            INTEGER,
  type            TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contribution_attachments_contribution ON contribution_attachments (contribution_id);

INSERT INTO contribution_attachments (contribution_id, url, name, size, type)
SELECT id, attachment_url, attachment_name, attachment_size, attachment_type
FROM contributions
WHERE attachment_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contribution_attachments a WHERE a.contribution_id = contributions.id
  );

