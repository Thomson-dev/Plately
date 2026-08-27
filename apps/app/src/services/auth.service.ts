import { env } from '../config/env';
import { hashPassword, comparePassword, hashToken } from '../utils/hash.util';
import {
  signAccessToken,
  generateRefreshToken,
  parseDurationMs,
} from '../utils/token.util';
import * as UserModel from '../models/User';
import * as RefreshTokenModel from '../models/RefreshToken';
import type { User } from '../models';
import { HttpError } from '../utils/http-error';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(user: User): Promise<TokenPair> {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();

  await RefreshTokenModel.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + parseDurationMs(env.jwt.refreshExpires)),
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ user: User } & TokenPair> {
  const email = input.email.toLowerCase();
  const existing = await UserModel.findByEmail(email);
  if (existing) throw new HttpError(409, 'Email already registered');

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({ email, passwordHash, name: input.name });

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: User } & TokenPair> {
  const user = await UserModel.findByEmail(input.email.toLowerCase());
  if (!user) throw new HttpError(401, 'Invalid email or password');

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid email or password');

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

export async function refresh(
  oldRefreshToken: string | undefined
): Promise<{ user: User } & TokenPair> {
  if (!oldRefreshToken) throw new HttpError(401, 'Refresh token required');

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await RefreshTokenModel.findByTokenHash(tokenHash);

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  const user = await UserModel.findById(stored.userId);
  if (!user) throw new HttpError(401, 'Invalid refresh token');

  // Rotate: revoke the used token and issue a new pair.
  await RefreshTokenModel.revoke(stored.id);

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

export async function logout(refreshTokenValue: string | undefined): Promise<void> {
  if (!refreshTokenValue) return;
  await RefreshTokenModel.revokeByTokenHash(hashToken(refreshTokenValue));
}
