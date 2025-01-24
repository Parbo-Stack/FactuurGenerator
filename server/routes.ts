import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  // Create HTTP server instance
  const httpServer = createServer(app);
  return httpServer;
}