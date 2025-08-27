import express, { type Request, Response, NextFunction } from "express";
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { env } from "./env";
import { legalRouter } from './routes/legal';
import { isSQLite } from "./db";
import "./jobs/reminder";

const app = express();

// Trust proxy (for deployments behind proxies)
app.set('trust proxy', 1);

// Security: Helmet with CSP allowing map tiles and inline styles in dev
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'", ...env.ALLOWED_ORIGINS],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
    }
  }
}));

// CORS
app.use(cors({
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return cb(null, true);
    return env.ALLOWED_ORIGINS.includes(origin) ? cb(null, true) : cb(new Error('CORS blocked'));
  },
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limit for API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Rate limit exceeded' }
});
app.use('/api', apiLimiter);
app.use('/api/v1', legalRouter);

app.use((req, res, next) => {
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

// Healthcheck
app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    env: env.NODE_ENV,
    time: new Date().toISOString(),
    origins: env.ALLOWED_ORIGINS,
  });
});

(async () => {
  const server = await registerRoutes(app);

  // 404 for unknown API routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  // Global error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = typeof err.status === 'number' ? err.status : 500;
    const payload: any = { message: err?.message || 'Internal Server Error' };
    if (err?.errors && typeof err.errors === 'object') payload.errors = err.errors;
    if (status >= 500) {
      console.error('[error]', err);
    } else {
      console.warn('[warn]', status, err?.message);
    }
    res.status(status).json(payload);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = env.PORT;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    const dbType = isSQLite ? 'SQLite' : 'Postgres';
    const mailMode = env.SMTP_HOST ? 'SMTP' : 'JSON';
    log(`ENV DB=${dbType} ALLOWED_ORIGINS=${JSON.stringify(env.ALLOWED_ORIGINS)} MAIL=${mailMode} ENABLE_DEV_SEED=${env.ENABLE_DEV_SEED}`);
  });
})();
