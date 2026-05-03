import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const reviewsRouter = Router();

const createSchema = z.object({
  orderId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().max(1000).optional()
});

reviewsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
  const { orderId, rating, text } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });
  if (!order || order.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });
  if (!order.sellerId) return res.status(400).json({ message: "У заказа не указан продавец" });
  if (order.status !== "DELIVERED") {
    return res.status(400).json({ message: "Оставить отзыв можно после получения заказа" });
  }

  try {
    const created = await prisma.review.create({
      data: {
        orderId: order.id,
        buyerId: req.user!.id,
        sellerId: order.sellerId,
        rating,
        text: text?.trim() ? text.trim() : null
      }
    });
    return res.status(201).json(created);
  } catch {
    return res.status(400).json({ message: "Нельзя оставить отзыв повторно" });
  }
});

