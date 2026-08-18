-- ============================================================
-- Contribution Tracker – Database Schema
-- Run this in Neon's SQL editor
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 2. Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source        TEXT    NOT NULL DEFAULT 'manual',
  category      TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  time_estimate REAL    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Seed placeholder users (idempotent)
INSERT INTO users (name) VALUES
  ('Member 1'),
  ('Member 2'),
  ('Member 3')
ON CONFLICT (name) DO NOTHING;
