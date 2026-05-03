import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireAuth);
adminOrdersRouter.use(requireAdmin);

const statusSchema = z.enum(["CREATED", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]);

const updateStatusSchema = z.object({
  status: statusSchema
});

const allowedTransitions: Record<string, Set<string>> = {
  CREATED: new Set(["CONFIRMED", "CANCELLED"]),
  CONFIRMED: new Set(["PAID", "CANCELLED"]),
  PAID: new Set(["SHIPPED"]),
  SHIPPED: new Set(["DELIVERED"]),
  DELIVERED: new Set([]),
  CANCELLED: new Set([])
};

adminOrdersRouter.patch("/:id/status", async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) return { kind: "not_found" as const };

      const next = parsed.data.status;
      // treat legacy PENDING as CREATED
      const from = order.status === "PENDING" ? "CREATED" : order.status;
      const ok = allowedTransitions[from]?.has(next) ?? false;
      if (!ok) return { kind: "bad_transition" as const, from, next };

      const updated = await tx.order.update({
        where: { id },
        data: { status: next },
        include: {
          items: { include: { product: { select: { id: true, name: true, category: true } } } },
          user: { select: { id: true, email: true, name: true } }
        }
      });

      if (next === "CANCELLED") {
        for (const it of order.items) {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity } }
          });
        }
      }

      return { kind: "ok" as const, order: updated };
    });

    if (result.kind === "not_found") return res.status(404).json({ message: "Not found" });
    if (result.kind === "bad_transition") {
      return res.status(400).json({ message: `Нельзя перевести заказ из ${result.from} в ${result.next}` });
    }
    return res.json(result.order);
  } catch {
    return res.status(400).json({ message: "Cannot update status" });
  }
});

