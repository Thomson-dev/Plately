import { Pool, PoolClient } from 'pg';
import { env } from './env';

// Shared connection pool, reused across the app (and across tsx watch
// reloads in dev) to avoid exhausting Postgres connections.
export const pool = new Pool({ connectionString: env.databaseUrl });

// Common surface shared by Pool and PoolClient, so model `create`/`update`
// functions can accept either — the bare pool for standalone calls, or a
// checked-out client to run inside a transaction.
export type Queryable = Pick<Pool | PoolClient, 'query'>;

// Runs `fn` with a client checked out of the pool and wrapped in
// BEGIN/COMMIT, rolling back on any error so multi-statement writes (e.g.
// creating an order plus its order_items) never leave partial state behind.
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function connectDB(): Promise<void> {
  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');
}


export async function disconnectDB(): Promise<void> {
  await pool.end();
}
