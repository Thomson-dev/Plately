import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Refresh tokens are opaque random strings; we store only their SHA-256
// hash in the DB so a DB leak doesn't expose usable tokens.
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
