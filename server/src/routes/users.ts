import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const usersRouter = Router();

usersRouter.get("/:id", async (req, res) => {
  const id = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, createdAt: true }
  });
  if (!user) return res.status(404).json({ message: "Not found" });

  const [products, reviews, agg] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: id, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 24
    }),
    prisma.review.findMany({
      where: { sellerId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { buyer: { select: { id: true, name: true } } }
    }),
    prisma.review.aggregate({
      where: { sellerId: id },
      _count: { _all: true },
      _avg: { rating: true }
    })
  ]);

  return res.json({
    user,
    stats: { reviewsCount: agg._count._all, ratingAvg: agg._avg.rating ?? null },
    products,
    reviews
  });
});

