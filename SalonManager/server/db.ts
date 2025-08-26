import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { Pool } from 'pg';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';
import { env } from './env';

const url = env.DATABASE_URL;
export const isSQLite = url.startsWith('file:');

let db: any;
if (isSQLite) {
  const sqlite = new Database(url.replace('file:', ''));
  db = drizzleSqlite(sqlite, { schema });
  console.log(`[db] SQLite ${url}`);
} else {
  const pool = new Pool({ connectionString: url });
  db = drizzlePg(pool, { schema });
  console.log(`[db] Postgres ${url}`);
}

export { db };
