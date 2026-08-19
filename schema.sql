-- ============================================================
-- Contribution Tracker – Database Schema (v3: Multi-Project)
-- ============================================================

-- ------------------------------------------------------------
-- SECTION A: Fresh Database Setup (Destructive)
-- ⚠️  Only use this for clean installs / resetting your database.
-- ------------------------------------------------------------

-- 1. Drop old tables (order matters for FK dependencies)
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
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source        TEXT    NOT NULL DEFAULT 'manual',
  category      TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  time_estimate REAL    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
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
