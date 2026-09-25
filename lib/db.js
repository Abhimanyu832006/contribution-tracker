import { Pool, types } from 'pg';

// Force pg driver to parse TIMESTAMP (without timezone) as UTC,
// preventing the driver from interpreting database dates as local server time.
types.setTypeParser(1114, function(stringValue) {
  return new Date(stringValue.replace(" ", "T") + "Z");
});

// Reuse pool across hot reloads in dev by storing on globalThis
let pool;

if (!globalThis._pgPool) {
  const connectionString = process.env.DATABASE_URL || '';

  // Local vs Cloud SSL auto-detection:
  // - Local PostgreSQL instances (localhost / 127.0.0.1) typically do not configure SSL.
  // - Cloud-hosted databases (Neon, Supabase, AWS RDS) enforce SSL connections.
  // We automatically detect local URLs to avoid SSL handshake errors during local development.
  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  globalThis._pgPool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    // Vercel runs many concurrent serverless function instances, each
    // getting its own pool — a generous per-instance `max` (the pg
    // default is 10) multiplies across instances and blows through a
    // session-mode pooler's total client cap (e.g. Supabase's default
    // 15) under any real concurrent traffic, surfacing as
    // "EMAXCONNSESSION: max clients reached". Keeping each instance's
    // pool small, plus releasing idle clients quickly, leaves headroom
    // for multiple concurrent instances to share the same cap.
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}

pool = globalThis._pgPool;

let schemaInitialized = false;
export async function ensureSchema() {
  if (schemaInitialized || !process.env.DATABASE_URL) return;
  try {
    await pool.query(`
      ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
      ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachment_name TEXT;
      ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
      ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachment_type TEXT;
      CREATE TABLE IF NOT EXISTS contribution_votes (
        id              SERIAL PRIMARY KEY,
        contribution_id INTEGER NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote            TEXT NOT NULL CHECK (vote IN ('approve', 'flag')),
        comment         TEXT,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_contribution_user_vote UNIQUE (contribution_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_contributions_project_user ON contributions (project_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_contributions_project_status ON contributions (project_id, status);
      CREATE INDEX IF NOT EXISTS idx_contributions_project_category ON contributions (project_id, category);
      CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members (project_id);
      CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members (user_id);
      CREATE INDEX IF NOT EXISTS idx_contribution_votes_contribution ON contribution_votes (contribution_id);

      -- Google Drive/Docs integration (mirrors the GitHub token/repo shape):
      -- a Google account's OAuth tokens live on the connecting user, a
      -- project points at one Drive folder to sync from, and synced docs
      -- get an identifying doc_id/doc_url pair the same way commits get
      -- commit_sha/commit_url.
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_folder_id TEXT;
      ALTER TABLE contributions ADD COLUMN IF NOT EXISTS doc_id TEXT;
      ALTER TABLE contributions ADD COLUMN IF NOT EXISTS doc_url TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_project_doc ON contributions (project_id, doc_id) WHERE doc_id IS NOT NULL;

      -- Word count captured at sync time for Google Docs, so the rating
      -- system (see Reports) can weigh document length instead of just
      -- counting "1 doc = 1 doc" regardless of size.
      ALTER TABLE contributions ADD COLUMN IF NOT EXISTS word_count INTEGER;

      -- Role-based access: student (GitHub login, unchanged) vs faculty
      -- (Google login, supervise-only). github_id becomes optional since
      -- faculty rows never have one; user_type defaults every existing
      -- row to 'student' for free via the column DEFAULT.
      ALTER TABLE users ALTER COLUMN github_id DROP NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'student';

      -- A second, faculty-only invite code per project (kept separate from
      -- invite_code so a leaked/shared student code can never grant
      -- faculty supervision access).
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS faculty_invite_code TEXT UNIQUE;

      -- Faculty supervise projects via a separate join table rather than
      -- project_members, so they never show up in student rosters, hours
      -- totals, or the contribution-score report.
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

      -- Faculty remarks on a contribution — deliberately separate from
      -- contribution_votes: never counted toward the approve/flag
      -- majority or the contribution score.
      CREATE TABLE IF NOT EXISTS contribution_remarks (
        id              SERIAL PRIMARY KEY,
        contribution_id INTEGER NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
        faculty_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        remark          TEXT NOT NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_contribution_remarks_contribution ON contribution_remarks (contribution_id);

      -- Backfill a faculty invite code for projects created before this
      -- column existed (new projects get one at creation time instead).
      UPDATE projects
      SET faculty_invite_code = UPPER(SUBSTRING(MD5(id::text || random()::text || clock_timestamp()::text) FOR 8))
      WHERE faculty_invite_code IS NULL;

      -- User-editable display name shown everywhere instead of the raw
      -- GitHub/Google login name. Kept as its own column rather than
      -- overwriting github_username, since github_username is still the
      -- real GitHub login used for commit-author matching in the GitHub
      -- sync (see app/api/projects/sync-github/route.js).
      ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
    `);
    schemaInitialized = true;
  } catch (err) {
    console.error("ensureSchema failed:", err);
  }
}

export default pool;
