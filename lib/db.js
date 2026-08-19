import { Pool } from 'pg';

// Reuse pool across hot reloads in dev by storing on globalThis
let pool;

if (!globalThis._pgPool) {
  const connectionString = process.env.DATABASE_URL || '';
  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  globalThis._pgPool = new Pool({
    connectionString,
    // Disable SSL for local Postgres, enable for cloud DBs (Supabase/Neon)
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

pool = globalThis._pgPool;

export default pool;
