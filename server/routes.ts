import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { invoices, invoiceItems } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Create a new invoice
  app.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const userId = req.user!.id;
      const data = req.body;

      // Start a transaction
      await db.transaction(async (tx) => {
        // Create the invoice
        const [invoice] = await tx
          .insert(invoices)
          .values({
            userId,
            invoiceNumber: data.invoiceNumber,
            status: data.status,
            currency: data.currency,
            vatRate: data.vatRate,
            subtotal: data.subtotal,
            vatAmount: data.vatAmount,
            total: data.total,
            issueDate: data.issueDate,
            dueDate: data.dueDate,
            notes: data.notes,
            recipientDetails: data.recipientDetails,
            senderDetails: data.senderDetails,
          })
          .returning();

        // Create invoice items
        await tx
          .insert(invoiceItems)
          .values(
            data.items.map((item: any) => ({
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            }))
          );
      });

      res.json({ message: "Invoice saved successfully" });
    } catch (error: any) {
      console.error("Failed to save invoice:", error);
      res.status(500).json({
        message: "Failed to save invoice",
        error: error.message,
      });
    }
  });

  // Get user's invoices
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const userId = req.user!.id;
      const userInvoices = await db.query.invoices.findMany({
        where: (invoices, { eq }) => eq(invoices.userId, userId),
        with: {
          items: true,
        },
        orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
      });

      res.json(userInvoices);
    } catch (error: any) {
      console.error("Failed to fetch invoices:", error);
      res.status(500).json({
        message: "Failed to fetch invoices",
        error: error.message,
      });
    }
  });

  const httpServer = createServer(app);
  // Error handling middleware with improved browser support
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Server error:", err);

    // Set CORS headers even for errors
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    });

    res.status(err.status || 500).json({
      message: err.message || 'Something broke!',
      success: false
    });
  });
  return httpServer;
}