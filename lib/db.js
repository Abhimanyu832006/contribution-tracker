import { Pool } from 'pg';

// Reuse pool across hot reloads in dev by storing on globalThis
let pool;

if (!globalThis._pgPool) {
  globalThis._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

pool = globalThis._pgPool;

export default pool;
