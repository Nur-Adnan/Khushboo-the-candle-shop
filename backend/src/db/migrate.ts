import { readFileSync } from 'node:fs';
import path from 'node:path';
import { closePool, query } from './index';

async function migrate(): Promise<void> {
  const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  await query(sql);
  console.log('Migration 001_initial_schema.sql completed');
}

migrate()
  .catch((error) => {
    console.error('Migration failed');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
