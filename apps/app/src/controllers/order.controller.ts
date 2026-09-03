import type { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/order.service';
import { createOrderSchema } from '../types/order-requests';

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request body', errors: parsed.error.flatten() });
      return;
    }

    const customerId = req.user!.sub;
    const { order, items } = await orderService.createOrder(customerId, parsed.data);

    res.status(201).json({ order, items });
  } catch (err) {
    next(err);
  }
}
