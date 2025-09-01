import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { env } from './env';

// This environment is only configured for Postgres connections.
const pool = new Pool({ connectionString: env.DATABASE_URL });
export const isSQLite = false;
export const db = drizzle(pool, { schema });
console.log(`[db] Postgres ${env.DATABASE_URL}`);
