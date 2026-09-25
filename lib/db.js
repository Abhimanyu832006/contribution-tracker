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
    `);
    schemaInitialized = true;
  } catch (err) {
    console.error("ensureSchema failed:", err);
  }
}

export default pool;
