-- ============================================================
-- Contribution Tracker – Database Schema (v2)
-- Run this in Neon's SQL editor
-- ⚠️  This DROPS existing tables — all seed data will be lost
-- ============================================================

-- 1. Drop old tables (order matters for FK dependencies)
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 2. Projects table
CREATE TABLE projects (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  leader_id   INTEGER,                 -- FK added below (circular dep)
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Users table (GitHub-backed)
CREATE TABLE users (
  id                  SERIAL PRIMARY KEY,
  github_id           TEXT UNIQUE NOT NULL,
  github_username     TEXT NOT NULL,
  avatar_url          TEXT,
  github_access_token TEXT,
  role                TEXT NOT NULL DEFAULT 'member'
                        CHECK (role IN ('leader', 'member')),
  project_id          INTEGER REFERENCES projects(id) ON DELETE SET NULL
);

-- 4. Add the FK from projects.leader_id → users.id
ALTER TABLE projects
  ADD CONSTRAINT fk_leader
  FOREIGN KEY (leader_id) REFERENCES users(id);

-- 5. Contributions table (columns unchanged from v1)
CREATE TABLE contributions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source        TEXT    NOT NULL DEFAULT 'manual',
  category      TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  time_estimate REAL    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
