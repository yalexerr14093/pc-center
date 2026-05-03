import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./lib/env.js";
import http from "node:http";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { conversationsRouter } from "./routes/conversations.js";
import { adminRouter } from "./routes/admin.js";
import { adminOrdersRouter } from "./routes/adminOrders.js";
import { usersRouter } from "./routes/users.js";
import { reviewsRouter } from "./routes/reviews.js";
import { reportsRouter } from "./routes/reports.js";
import { initSocket } from "./realtime/socket.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

app.use(
  helmet({
    // allow embedding images/files from API origin into frontend origin during dev
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      const raw = env.CLIENT_ORIGIN?.trim();
      const allowed = raw
        ? raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // Allow non-browser clients and same-origin requests
      if (!origin) return callback(null, true);

      // If no allowlist configured, allow all (dev-friendly)
      if (allowed.length === 0) return callback(null, true);

      if (allowed.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(morgan("dev"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders(res) {
      // Explicitly allow using these files from other origins (e.g. Vite dev server)
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    }
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

// So opening http://localhost:PORT/ in a browser is not a blank "Cannot GET /"
app.get("/", (_req, res) => {
  res.type("html").send(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PC-Center API</title></head><body>` +
      `<p>API работает. Проверка: <a href="/health">/health</a></p>` +
      `<p>Маршруты приложения: префикс <code>/api</code> (например <code>/api/products</code>).</p>` +
      `</body></html>`
  );
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/payments", paymentsRouter);

const port = env.PORT ?? 4000;
// Bind all interfaces so http://127.0.0.1 and http://localhost behave consistently on Windows
const server = http.createServer(app);
initSocket(server);

server.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port} (0.0.0.0:${port})`);
});

