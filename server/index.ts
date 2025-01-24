import express from "express";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

(async () => {
  try {
    const server = app.listen(5000, "0.0.0.0", () => {
      log(`serving on port 5000`);
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();

// Handle process-wide unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});