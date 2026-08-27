import { Pool } from 'pg';
import { env } from './env';

// Shared connection pool, reused across the app (and across tsx watch
// reloads in dev) to avoid exhausting Postgres connections.
export const pool = new Pool({ connectionString: env.databaseUrl });

export async function connectDB(): Promise<void> {
  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');
}


export async function disconnectDB(): Promise<void> {
  await pool.end();
}
