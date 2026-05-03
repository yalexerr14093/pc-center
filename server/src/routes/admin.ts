import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

adminRouter.get("/conversations", async (_req: AuthedRequest, res) => {
  const items = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      product: { select: { id: true, name: true, imageUrl: true, priceRub: true } },
      buyer: { select: { id: true, email: true, name: true } },
      seller: { select: { id: true, email: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, text: true, createdAt: true, senderId: true }
      }
    }
  });
  return res.json({ items });
});

adminRouter.get("/conversations/:id/messages", async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const convo = await prisma.conversation.findUnique({ where: { id } });
  if (!convo) return res.status(404).json({ message: "Not found" });

  const items = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, email: true } } }
  });
  return res.json({ items });
});

adminRouter.get("/orders", async (_req: AuthedRequest, res) => {
  const items = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      items: true,
      user: { select: { id: true, email: true, name: true } }
    }
  });
  return res.json({ items });
});

adminRouter.get("/orders/:id", async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, name: true, category: true } } } },
      user: { select: { id: true, email: true, name: true } }
    }
  });
  if (!order) return res.status(404).json({ message: "Not found" });
  return res.json(order);
});

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

adminRouter.get("/analytics", async (_req: AuthedRequest, res) => {
  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 30);

  const [users, orders, orderItems, products] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, createdAt: true }
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, userId: true, totalRub: true, createdAt: true }
    }),
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since } } },
      select: { quantity: true, priceRub: true, productId: true, name: true }
    }),
    prisma.product.findMany({ select: { id: true, category: true } })
  ]);

  const totalUsers = await prisma.user.count();
  const totalOrders = await prisma.order.count();
  const buyersEver = await prisma.order.groupBy({
    by: ["userId"],
    _count: { userId: true }
  });

  const usersPerDayMap = new Map<string, number>();
  for (const u of users) {
    const k = dayKey(u.createdAt);
    usersPerDayMap.set(k, (usersPerDayMap.get(k) ?? 0) + 1);
  }

  const ordersPerDayMap = new Map<string, { count: number; revenue: number }>();
  for (const o of orders) {
    const k = dayKey(o.createdAt);
    const cur = ordersPerDayMap.get(k) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += o.totalRub;
    ordersPerDayMap.set(k, cur);
  }

  const catMap = new Map<string, { quantity: number; revenue: number }>();
  const prodCat = new Map(products.map((p) => [p.id, p.category]));
  for (const it of orderItems) {
    const cat = prodCat.get(it.productId) ?? "UNKNOWN";
    const cur = catMap.get(cat) ?? { quantity: 0, revenue: 0 };
    cur.quantity += it.quantity;
    cur.revenue += it.priceRub * it.quantity;
    catMap.set(cat, cur);
  }

  const topMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const it of orderItems) {
    const cur = topMap.get(it.productId) ?? { name: it.name, quantity: 0, revenue: 0 };
    cur.quantity += it.quantity;
    cur.revenue += it.priceRub * it.quantity;
    topMap.set(it.productId, cur);
  }
  const topProducts = [...topMap.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 12);

  const revenueAll = orders.reduce((s, o) => s + o.totalRub, 0);
  const itemsSold = orderItems.reduce((s, it) => s + it.quantity, 0);

  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(dayKey(d));
  }

  return res.json({
    summary: {
      totalUsers,
      totalOrders,
      distinctBuyers: buyersEver.length,
      last30Days: {
        newUsers: users.length,
        orders: orders.length,
        itemsSold,
        revenueRub: revenueAll
      }
    },
    series: {
      usersPerDay: days.map((d) => ({ date: d, count: usersPerDayMap.get(d) ?? 0 })),
      ordersPerDay: days.map((d) => {
        const v = ordersPerDayMap.get(d);
        return {
          date: d,
          count: v?.count ?? 0,
          revenueRub: v?.revenue ?? 0
        };
      })
    },
    ordersByCategory: [...catMap.entries()].map(([category, v]) => ({ category, ...v })),
    topProducts
  });
});
