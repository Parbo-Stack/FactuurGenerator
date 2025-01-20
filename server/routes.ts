import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";

export function registerRoutes(app: Express): Server {
  // API routes would go here if needed
  // Currently we don't need any API routes as everything is handled client-side

  const httpServer = createServer(app);

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  return httpServer;
}