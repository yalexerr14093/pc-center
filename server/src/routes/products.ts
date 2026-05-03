import { Router, type Request } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const productsRouter = Router();

const listQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(["CPU", "GPU", "MOTHERBOARD", "RAM", "SSD"]).optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),
  city: z.string().min(1).max(80).optional(),
  condition: z.enum(["NEW", "LIKE_NEW", "USED", "FOR_PARTS"]).optional(),
  inStock: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional(),
  sort: z.enum(["new", "price_asc", "price_desc", "popular"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  /** JSON specs.socket (CPU, материнки) */
  socket: z.string().min(1).max(40).optional(),
  /** specs.type для ОЗУ */
  ramType: z.enum(["DDR4", "DDR5"]).optional(),
  ramMinGb: z.coerce.number().int().positive().optional(),
  ramMaxGb: z.coerce.number().int().positive().optional(),
  /** specs.tdpW ≤ */
  cpuTdpMax: z.coerce.number().int().positive().optional(),
  /** specs.powerW ≤ */
  gpuPowerMax: z.coerce.number().int().positive().optional(),
  /** specs.formFactor */
  mbFormFactor: z.string().min(1).max(40).optional(),
  ssdMinTb: z.coerce.number().positive().optional(),
  ssdMaxTb: z.coerce.number().positive().optional(),
  /** подстрока в specs.interface */
  ssdInterface: z.string().min(1).max(80).optional()
});

const createProductSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  category: z.enum(["CPU", "GPU", "MOTHERBOARD", "RAM", "SSD"]),
  priceRub: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().nonnegative().default(1),
  city: z.string().min(2).max(80).optional(),
  condition: z.enum(["NEW", "LIKE_NEW", "USED", "FOR_PARTS"]).optional()
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (err: Error | null, dest: string) => void) => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      // server/src/routes -> server/uploads
      const uploadsDir = path.join(__dirname, "..", "..", "uploads");
      fs.mkdirSync(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, dest: string) => void) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
      cb(null, name);
    }
  }),
  limits: { files: 10, fileSize: 8 * 1024 * 1024 }
});

function specFiltersFromQuery(data: z.infer<typeof listQuerySchema>): Prisma.ProductWhereInput[] {
  const parts: Prisma.ProductWhereInput[] = [];
  const {
    socket,
    ramType,
    ramMinGb,
    ramMaxGb,
    cpuTdpMax,
    gpuPowerMax,
    mbFormFactor,
    ssdMinTb,
    ssdMaxTb,
    ssdInterface
  } = data;

  if (socket) parts.push({ specs: { path: ["socket"], equals: socket } });
  if (ramType) parts.push({ specs: { path: ["type"], equals: ramType } });
  if (ramMinGb != null) parts.push({ specs: { path: ["capacityGb"], gte: ramMinGb } });
  if (ramMaxGb != null) parts.push({ specs: { path: ["capacityGb"], lte: ramMaxGb } });
  if (cpuTdpMax != null) parts.push({ specs: { path: ["tdpW"], lte: cpuTdpMax } });
  if (gpuPowerMax != null) parts.push({ specs: { path: ["powerW"], lte: gpuPowerMax } });
  if (mbFormFactor) parts.push({ specs: { path: ["formFactor"], equals: mbFormFactor } });
  if (ssdMinTb != null) parts.push({ specs: { path: ["capacityTb"], gte: ssdMinTb } });
  if (ssdMaxTb != null) parts.push({ specs: { path: ["capacityTb"], lte: ssdMaxTb } });
  if (ssdInterface) {
    parts.push({
      specs: { path: ["interface"], string_contains: ssdInterface, mode: "insensitive" }
    });
  }
  return parts;
}

productsRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "Invalid query" });

  const data = parsed.data;
  const { q, category, priceMin, priceMax, city, condition, inStock, sort, page, limit } = data;

  const take = limit ?? 24;
  const skip = ((page ?? 1) - 1) * take;

  const inStockBool = inStock === "1" || inStock === "true";

  const orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
    sort === "price_asc"
      ? ({ priceRub: "asc" } as const)
      : sort === "price_desc"
        ? ({ priceRub: "desc" } as const)
        : sort === "popular"
          ? ([
              { orderItems: { _count: "desc" as const } },
              { createdAt: "desc" as const }
            ] as Prisma.ProductOrderByWithRelationInput[])
          : ({ createdAt: "desc" } as const);

  const and: Prisma.ProductWhereInput[] = [...specFiltersFromQuery(data)];
  if (category) and.push({ category });
  if (condition) and.push({ condition });
  if (city) and.push({ city: { equals: city, mode: "insensitive" } });
  if (q) and.push({ name: { contains: q, mode: "insensitive" } });
  if (inStock != null && inStockBool) and.push({ stock: { gt: 0 } });
  if (priceMin != null || priceMax != null) {
    and.push({
      priceRub: {
        ...(priceMin != null ? { gte: priceMin } : {}),
        ...(priceMax != null ? { lte: priceMax } : {})
      }
    });
  }

  const where: Prisma.ProductWhereInput = and.length ? { isHidden: false, AND: and } : { isHidden: false };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { seller: { select: { id: true, name: true } } },
      orderBy,
      skip,
      take
    }),
    prisma.product.count({ where })
  ]);

  return res.json({ items, page: page ?? 1, limit: take, total });
});

productsRouter.get("/suggest", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) return res.json({ suggestions: [] as string[] });

  const rows = await prisma.product.findMany({
    where: {
      isHidden: false,
      name: { contains: q, mode: "insensitive" }
    },
    select: { name: true },
    take: 20,
    orderBy: { createdAt: "desc" }
  });

  const seen = new Set<string>();
  const suggestions: string[] = [];
  for (const r of rows) {
    const n = r.name.trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    suggestions.push(n);
    if (suggestions.length >= 8) break;
  }
  return res.json({ suggestions });
});

productsRouter.get("/me/mine", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const items = await prisma.product.findMany({
    where: { sellerId: req.user.id },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ items });
});

productsRouter.get("/me/analytics", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const sellerId = req.user.id;

  const products = await prisma.product.findMany({
    where: { sellerId },
    select: {
      id: true,
      name: true,
      category: true,
      priceRub: true,
      isHidden: true,
      viewCount: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  const productIds = products.map((p) => p.id);
  if (!productIds.length) {
    return res.json({
      summary: {
        listings: 0,
        activeListings: 0,
        totalViews: 0,
        soldUnits: 0,
        conversations: 0,
        revenueRub: 0
      },
      listings: [],
      ordersByDay: [],
      demandIdeas: []
    });
  }

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);

  const [orderItemsAgg, convAgg, sellerOrders, globalDemand] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _sum: { quantity: true }
    }),
    prisma.conversation.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _count: { _all: true }
    }),
    prisma.order.findMany({
      where: {
        sellerId,
        createdAt: { gte: since14 },
        status: { not: "CANCELLED" }
      },
      select: { id: true, createdAt: true, totalRub: true }
    }),
    prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: since30 }, status: { not: "CANCELLED" } }
      },
      select: { quantity: true, product: { select: { category: true } } }
    })
  ]);

  const soldByProduct = new Map(orderItemsAgg.map((r) => [r.productId, r._sum.quantity ?? 0]));
  const convByProduct = new Map(convAgg.map((r) => [r.productId, r._count._all]));

  const revenueRows = await prisma.order.findMany({
    where: { sellerId, status: { not: "CANCELLED" } },
    select: { totalRub: true }
  });
  const revenueRub = revenueRows.reduce((s, o) => s + o.totalRub, 0);

  const totalViews = products.reduce((s, p) => s + p.viewCount, 0);
  const soldUnits = products.reduce((s, p) => s + (soldByProduct.get(p.id) ?? 0), 0);
  const conversations = products.reduce((s, p) => s + (convByProduct.get(p.id) ?? 0), 0);
  const activeListings = products.filter((p) => !p.isHidden).length;

  const listings = products.map((p) => {
    const views = p.viewCount;
    const orders = soldByProduct.get(p.id) ?? 0;
    const msgs = convByProduct.get(p.id) ?? 0;
    const v = Math.max(views, 1);
    return {
      ...p,
      soldUnits: orders,
      conversations: msgs,
      conversionOrderPct: Math.round((orders / v) * 1000) / 10,
      conversionMsgPct: Math.round((msgs / v) * 1000) / 10
    };
  });

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const byDay = new Map<string, { count: number; revenueRub: number }>();
  for (const o of sellerOrders) {
    const k = dayKey(o.createdAt);
    const cur = byDay.get(k) ?? { count: 0, revenueRub: 0 };
    cur.count += 1;
    cur.revenueRub += o.totalRub;
    byDay.set(k, cur);
  }
  const ordersByDay = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, count: v.count, revenueRub: v.revenueRub }));

  const catUnits: Record<string, number> = {};
  for (const row of globalDemand) {
    const c = row.product.category;
    catUnits[c] = (catUnits[c] ?? 0) + row.quantity;
  }
  const demandIdeas = Object.entries(catUnits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, soldUnits30d]) => ({
      category,
      soldUnits30d,
      hint:
        category === "GPU"
          ? "Высокий спрос на видеокарты — проверьте конкурентные цены."
          : category === "CPU"
            ? "Процессоры стабильно продаются — уточните комплектацию в описании."
            : category === "RAM"
              ? "Комплекты ОЗУ часто берут парами — укажите XMP/EXPO."
              : category === "SSD"
                ? "SSD с NVMe и 1 ТБ — самый частый запрос."
                : "Материнские платы: покупатели смотрят на сокет и Wi‑Fi."
    }));

  return res.json({
    summary: {
      listings: products.length,
      activeListings,
      totalViews,
      soldUnits,
      conversations,
      revenueRub
    },
    listings,
    ordersByDay,
    demandIdeas
  });
});

productsRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { seller: { select: { id: true, name: true } } }
  });
  if (!product || product.isHidden) return res.status(404).json({ message: "Not found" });
  void prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
  return res.json({ ...product, viewCount: product.viewCount + 1 });
});

productsRouter.patch("/:id/hide", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id;
  const updated = await prisma.product.updateMany({
    where: { id, sellerId: req.user.id },
    data: { isHidden: true }
  });
  if (!updated.count) return res.status(404).json({ message: "Not found" });
  return res.json({ ok: true });
});

productsRouter.patch("/:id/unhide", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id;
  const updated = await prisma.product.updateMany({
    where: { id, sellerId: req.user.id },
    data: { isHidden: false }
  });
  if (!updated.count) return res.status(404).json({ message: "Not found" });
  return res.json({ ok: true });
});

productsRouter.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id;
  const deleted = await prisma.product.deleteMany({ where: { id, sellerId: req.user.id } });
  if (!deleted.count) return res.status(404).json({ message: "Not found" });
  return res.json({ ok: true });
});

productsRouter.post("/", requireAuth, upload.array("images", 10), async (req: AuthedRequest, res) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      issues: parsed.error.issues
    });
  }
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const files = (req as AuthedRequest & { files?: Express.Multer.File[] }).files ?? [];
  if (!files.length) return res.status(400).json({ message: "Добавьте хотя бы 1 изображение" });

  const imageUrls = files.map((f) => `/uploads/${f.filename}`);
  const mainImageUrl = imageUrls[0];

  const specs: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(req.body ?? {})) {
    if (!k.startsWith("spec_")) continue;
    const key = k.slice("spec_".length);
    if (!key) continue;
    const value = typeof v === "string" ? v.trim() : v;
    if (value === "" || value == null) continue;
    specs[key] = value;
  }

  const created = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      priceRub: parsed.data.priceRub,
      imageUrl: mainImageUrl,
      imageUrls,
      specs: specs as Prisma.InputJsonValue,
      stock: parsed.data.stock,
      city: parsed.data.city ?? null,
      condition: parsed.data.condition ?? "USED",
      sellerId: req.user.id
    },
    include: { seller: { select: { id: true, name: true } } }
  });

  return res.status(201).json(created);
});

