import { pool } from '../config/db';

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
}

function mapRow(row: RefreshTokenRow): RefreshToken {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    revoked: row.revoked,
    createdAt: row.created_at,
  };
}

export async function create(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<RefreshToken> {
  const result = await pool.query<RefreshTokenRow>(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.userId, input.tokenHash, input.expiresAt]
  );
  return mapRow(result.rows[0]);
}

export async function findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
  const result = await pool.query<RefreshTokenRow>(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function revoke(id: string): Promise<void> {
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [id]);
}

export async function revokeByTokenHash(tokenHash: string): Promise<void> {
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [tokenHash]);
}
