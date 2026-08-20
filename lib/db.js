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

export default pool;
