import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import { setupAuth } from "./auth";
import { createServer, type Server } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

let server: ReturnType<typeof createServer> | null = null;
let retries = 0;
const MAX_RETRIES = 5;

async function startServer() {
  try {
    // Test database connection first
    await db.query.users.findMany().execute();
    log("Database connection successful");

    // Set up authentication
    setupAuth(app);

    server = registerRoutes(app);

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

    // Handle server shutdown gracefully
    const closeServer = () => {
      if (server) {
        server.close(() => {
          log("Server closed");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', closeServer);
    process.on('SIGINT', closeServer);

    // Try to start the server with proper error handling and retries
    const startServerWithRetry = () => {
      server?.listen(PORT, "0.0.0.0", () => {
        log(`serving on port ${PORT}`);
        retries = 0; // Reset retries on successful start
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          if (retries < MAX_RETRIES) {
            retries++;
            log(`Port ${PORT} is in use, attempt ${retries} of ${MAX_RETRIES} to recover...`);
            setTimeout(() => {
              server?.close();
              startServerWithRetry();
            }, 2000); // Increased delay between retries
          } else {
            console.error(`Failed to start server after ${MAX_RETRIES} attempts`);
            process.exit(1);
          }
        } else {
          console.error("Server error:", err);
          process.exit(1);
        }
      });
    };

    startServerWithRetry();

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Handle process-wide unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Start the server
startServer();