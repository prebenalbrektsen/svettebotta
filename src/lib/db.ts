import { Pool, types } from "pg";

// One pool per server process (kept on globalThis so dev hot reloads don't leak connections).
const globalForPool = globalThis as unknown as { pool?: Pool };
const pool = globalForPool.pool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
globalForPool.pool = pool;

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

export async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

// Postgres "date" columns come back as plain "YYYY-MM-DD" strings, not midnight-UTC Dates.
types.setTypeParser(1082, (value: string) => value);
// bigint (strava ids) as strings, int8 counts from count(*) too - callers Number() what they need.
