import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const reportsRouter = Router();

const createSchema = z.object({
  targetType: z.enum(["PRODUCT", "CONVERSATION", "MESSAGE", "USER"]),
  targetId: z.string().min(1),
  reason: z.string().min(5).max(1000)
});

reportsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const { targetType, targetId, reason } = parsed.data;
  const data: any = {
    reporterId: req.user!.id,
    targetType,
    reason
  };
  if (targetType === "PRODUCT") data.productId = targetId;
  if (targetType === "CONVERSATION") data.conversationId = targetId;
  if (targetType === "MESSAGE") data.messageId = targetId;
  if (targetType === "USER") data.targetUserId = targetId;

  const created = await prisma.report.create({ data });
  return res.status(201).json(created);
});

// admin moderation
reportsRouter.get("/admin", requireAuth, requireAdmin, async (_req: AuthedRequest, res) => {
  const items = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      reporter: { select: { id: true, email: true, name: true } }
    }
  });
  return res.json({ items });
});

reportsRouter.post("/admin/:id/resolve", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const updated = await prisma.report.update({
    where: { id },
    data: { status: "RESOLVED" }
  });
  return res.json(updated);
});

