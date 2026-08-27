import { pool } from '../config/db';

export type Role = 'customer' | 'seller' | 'rider' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: Role;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByEmail(email: string): Promise<User | null> {
  const result = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function findById(id: string): Promise<User | null> {
  const result = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function create(input: {
  email: string;
  passwordHash: string;
  name?: string;
}): Promise<User> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.email, input.passwordHash, input.name ?? null]
  );
  return mapRow(result.rows[0]);
}
