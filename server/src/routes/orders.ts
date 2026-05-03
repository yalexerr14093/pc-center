import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const ordersRouter = Router();

const createOrderSchema = z.object({
  customerName: z.string().min(2).max(64),
  phone: z.string().min(6).max(32),
  address: z.string().min(8).max(256),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(99)
      })
    )
    .min(1)
});

ordersRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const userId = req.user!.id;
  const { customerName, phone, address, items } = parsed.data;

  const qtyByProduct = new Map<string, number>();
  for (const i of items) {
    qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) ?? 0) + i.quantity);
  }

  const productIds = [...qtyByProduct.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isHidden: false },
    select: { id: true, name: true, priceRub: true, stock: true, sellerId: true }
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const sellers = new Set(products.map((p) => p.sellerId).filter(Boolean) as string[]);
  if (sellers.size !== 1) {
    return res.status(400).json({ message: "Один заказ может содержать товары только от одного продавца" });
  }
  const sellerId = [...sellers][0];

  for (const [pid, qty] of qtyByProduct) {
    const p = byId.get(pid);
    if (!p) return res.status(400).json({ message: `Товар не найден: ${pid}` });
    if (qty > p.stock) {
      return res.status(400).json({
        message: `Недостаточно «${p.name}» на складе (нужно ${qty}, есть ${p.stock})`
      });
    }
  }

  const orderItems = items.map((i) => {
    const p = byId.get(i.productId)!;
    return {
      productId: p.id,
      name: p.name,
      priceRub: p.priceRub,
      quantity: i.quantity
    };
  });

  const totalRub = orderItems.reduce((sum, it) => sum + it.priceRub * it.quantity, 0);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          sellerId,
          customerName,
          phone,
          address,
          totalRub,
          status: "CREATED",
          items: { createMany: { data: orderItems } }
        },
        include: { items: true }
      });

      for (const [productId, qty] of qtyByProduct) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: qty } }
        });
      }

      return created;
    });

    return res.status(201).json(order);
  } catch {
    return res.status(400).json({ message: "Cannot create order" });
  }
});

ordersRouter.get("/my", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ items: orders });
});

ordersRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const userId = req.user!.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!order || order.userId !== userId) return res.status(404).json({ message: "Not found" });
  return res.json(order);
});

ordersRouter.post("/:id/cancel", requireAuth, async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const userId = req.user!.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!order || order.userId !== userId) return { kind: "not_found" as const };

      if (order.status === "CANCELLED") return { kind: "ok" as const, order };
      // allow cancel only before confirmation; treat legacy PENDING as CREATED
      const status = order.status === "PENDING" ? "CREATED" : order.status;
      if (status !== "CREATED") return { kind: "forbidden" as const, status };

      const updated = await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { items: true }
      });

      // return stock back
      for (const it of order.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity } }
        });
      }

      return { kind: "ok" as const, order: updated };
    });

    if (result.kind === "not_found") return res.status(404).json({ message: "Not found" });
    if (result.kind === "forbidden") {
      return res
        .status(400)
        .json({ message: `Заказ со статусом ${result.status} нельзя отменить через сайт` });
    }
    return res.json(result.order);
  } catch {
    return res.status(400).json({ message: "Cannot cancel order" });
  }
});
