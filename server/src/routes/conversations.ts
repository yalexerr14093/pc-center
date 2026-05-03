import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { getIo } from "../realtime/socket.js";

export const conversationsRouter = Router();

// list conversations for current user
conversationsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const [items, reads] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }]
      },
      orderBy: { updatedAt: "desc" },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, priceRub: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, text: true, createdAt: true, senderId: true }
        }
      }
    }),
    prisma.conversationRead.findMany({
      where: { userId: req.user.id },
      select: { conversationId: true, lastMessageId: true }
    })
  ]);

  const byConvo = new Map(reads.map((r) => [r.conversationId, r.lastMessageId]));
  return res.json({
    items: items.map((c) => ({
      ...c,
      lastReadMessageId: byConvo.get(c.id) ?? null
    }))
  });
});

const createSchema = z.object({
  productId: z.string().min(1)
});

// create or get existing conversation for product + buyer
conversationsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, sellerId: true }
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (!product.sellerId) return res.status(400).json({ message: "У этого товара нет продавца" });
  if (product.sellerId === req.user.id) return res.status(400).json({ message: "Нельзя написать самому себе" });

  const convo = await prisma.conversation.upsert({
    where: { productId_buyerId: { productId: product.id, buyerId: req.user.id } },
    create: {
      productId: product.id,
      buyerId: req.user.id,
      sellerId: product.sellerId
    },
    update: {},
    include: {
      product: { select: { id: true, name: true, imageUrl: true, priceRub: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } }
    }
  });

  return res.status(201).json(convo);
});

// get messages in a conversation (must be participant)
conversationsRouter.get("/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id;

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true, buyerId: true, sellerId: true }
  });
  if (!convo) return res.status(404).json({ message: "Not found" });
  if (convo.buyerId !== req.user.id && convo.sellerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const items = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } }
  });
  const read = await prisma.conversationRead.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: req.user.id } },
    select: { lastMessageId: true }
  });
  return res.json({ items, lastReadMessageId: read?.lastMessageId ?? null });
});

const readSchema = z.object({ messageId: z.string().min(1) });
conversationsRouter.post("/:id/read", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id;
  const parsed = readSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true, buyerId: true, sellerId: true }
  });
  if (!convo) return res.status(404).json({ message: "Not found" });
  if (convo.buyerId !== req.user.id && convo.sellerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const updated = await prisma.conversationRead.upsert({
    where: { conversationId_userId: { conversationId: id, userId: req.user.id } },
    create: { conversationId: id, userId: req.user.id, lastMessageId: parsed.data.messageId },
    update: { lastMessageId: parsed.data.messageId }
  });

  try {
    const io = getIo();
    io.to(`convo:${id}`).emit("conversation:read", {
      conversationId: id,
      userId: req.user.id,
      lastMessageId: updated.lastMessageId
    });
  } catch {}

  return res.json({ ok: true });
});

const sendSchema = z.object({
  text: z.string().min(1).max(2000)
});

conversationsRouter.post("/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id;
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true, buyerId: true, sellerId: true }
  });
  if (!convo) return res.status(404).json({ message: "Not found" });
  if (convo.buyerId !== req.user.id && convo.sellerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const msg = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: req.user.id,
      text: parsed.data.text
    },
    include: { sender: { select: { id: true, name: true } } }
  });

  // bump conversation updatedAt
  await prisma.conversation.update({ where: { id }, data: {} });

  try {
    const io = getIo();
    io.to(`convo:${id}`).emit("message:new", { conversationId: id, message: msg });
    // also notify both participants directly so they can update list/unread even if they didn't join convo room
    io.to(`user:${convo.buyerId}`).emit("conversation:updated", { conversationId: id });
    io.to(`user:${convo.sellerId}`).emit("conversation:updated", { conversationId: id });
  } catch {
    // ignore if socket not initialized
  }

  return res.status(201).json(msg);
});

