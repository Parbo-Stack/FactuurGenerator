import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { setupAuth } from "./auth";

// ── Env validatie ──────────────────────────────────────────────────────────────
const REQUIRED_ENV: string[] = ["DATABASE_URL", "SESSION_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `[startup] Ontbrekende omgevingsvariabelen: ${missing.join(", ")}\n` +
    `Kopieer .env.example naar .env en vul de waarden in.`
  );
  process.exit(1);
}

const app = express();

// ── Security headers (GDPR + EU compliance) ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.google-analytics.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// ── Rate limiting (alleen in productie) ──
const isDev = process.env.NODE_ENV !== "production";

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10_000 : 100,
  message: { error: "Te veel verzoeken. Probeer het over 15 minuten opnieuw." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10_000 : 30,
  message: { error: "Te veel API verzoeken. Probeer het over 15 minuten opnieuw." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use("/api", apiLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// ── X-Request-ID ──────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const reqId = (req.headers["x-request-id"] as string) || randomUUID();
  res.setHeader("X-Request-ID", reqId);
  next();
});

// ── HTML sanitization (strip tags uit string inputs) ─────────────────────────
function stripTags(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/<[^>]*>/g, "").trim();
  if (Array.isArray(value)) return value.map(stripTags);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripTags(v)])
    );
  }
  return value;
}

app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = stripTags(req.body);
  }
  next();
});

app.use((req, res, next) => {
  // CORS — alleen eigen domein + localhost in dev
  const allowedOrigins = [
    "https://factuurflow.com",
    "https://www.factuurflow.com",
    "http://localhost:5000",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Auth (session + passport) — vóór routes registreren
  setupAuth(app);

  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
