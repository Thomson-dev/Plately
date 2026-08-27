import type { Request, Response, NextFunction, CookieOptions } from 'express';
import * as authService from '../services/auth.service';
import { env } from '../config/env';
import { toSafeUser } from '../models';

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  path: '/api/auth',
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const { user, accessToken, refreshToken } = await authService.register({
      email,
      password,
      name,
    });

    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user: toSafeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const { user, accessToken, refreshToken } = await authService.login({ email, password });

    setRefreshCookie(res, refreshToken);
    res.json({ user: toSafeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incoming: string | undefined = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    const { user, accessToken, refreshToken } = await authService.refresh(incoming);

    setRefreshCookie(res, refreshToken);
    res.json({ user: toSafeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incoming: string | undefined = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    await authService.logout(incoming);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
