import dotenv from 'dotenv';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

dotenv.config({ quiet: true });

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return pool;
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
