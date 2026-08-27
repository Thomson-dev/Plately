import type { Request, Response, NextFunction } from 'express';
import * as UserModel from '../models/User';
import { toSafeUser } from '../models';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UserModel.findById(req.user!.sub);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}
