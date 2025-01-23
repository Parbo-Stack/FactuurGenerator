import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import cors from "cors";
import { db } from "@db";
import { expenses, income, users } from "@db/schema";
import { eq, and, between, like, desc, sql } from "drizzle-orm";
import { z } from "zod";
import nodemailer from "nodemailer";

// Validation schemas
const expenseFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  searchTerm: z.string().optional(),
});

const incomeFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  source: z.string().optional(),
  category: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  searchTerm: z.string().optional(),
});

export function registerRoutes(app: Express): Server {
  // Enable CORS with specific configuration
  app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400
  }));

  // Handle preflight requests
  app.options('*', cors());

  // Set up authentication routes and middleware
  setupAuth(app);

  // Income routes
  app.post("/api/income", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { date, amount, source, description, category, paymentMethod } = req.body;
      const userId = req.user!.id;

      const newIncome = await db.insert(income).values({
        userId,
        date: new Date(date),
        amount,
        source,
        description,
        category,
        paymentMethod,
      }).returning();

      res.json({ message: "Income entry created successfully", income: newIncome[0] });
    } catch (error: any) {
      console.error("Failed to create income entry:", error);
      res.status(500).json({ message: "Failed to create income entry", error: error.message });
    }
  });

  app.get("/api/income", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const filters = incomeFilterSchema.parse(req.query);
      const userId = req.user!.id;

      let baseQuery = db.select().from(income);
      const conditions = [eq(income.userId, userId)];

      if (filters.startDate && filters.endDate) {
        conditions.push(
          sql`${income.date} BETWEEN ${new Date(filters.startDate)} AND ${new Date(filters.endDate)}`
        );
      }

      if (filters.source) {
        conditions.push(eq(income.source, filters.source));
      }

      if (filters.category) {
        conditions.push(eq(income.category, filters.category));
      }

      if (filters.minAmount !== undefined) {
        conditions.push(sql`CAST(${income.amount} AS DECIMAL) >= ${filters.minAmount}`);
      }

      if (filters.maxAmount !== undefined) {
        conditions.push(sql`CAST(${income.amount} AS DECIMAL) <= ${filters.maxAmount}`);
      }

      if (filters.searchTerm) {
        conditions.push(like(income.description, `%${filters.searchTerm}%`));
      }

      const results = await baseQuery
        .where(and(...conditions))
        .orderBy(desc(income.date));

      res.json(results);
    } catch (error: any) {
      console.error("Failed to fetch income entries:", error);
      res.status(500).json({ message: "Failed to fetch income entries", error: error.message });
    }
  });

  app.put("/api/income/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const updatedIncome = await db
        .update(income)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(
          eq(income.id, parseInt(id)),
          eq(income.userId, userId)
        ))
        .returning();

      if (!updatedIncome.length) {
        return res.status(404).json({ message: "Income entry not found" });
      }

      res.json({ message: "Income entry updated successfully", income: updatedIncome[0] });
    } catch (error: any) {
      console.error("Failed to update income entry:", error);
      res.status(500).json({ message: "Failed to update income entry", error: error.message });
    }
  });

  app.delete("/api/income/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const userId = req.user!.id;

      const deletedIncome = await db
        .delete(income)
        .where(and(
          eq(income.id, parseInt(id)),
          eq(income.userId, userId)
        ))
        .returning();

      if (!deletedIncome.length) {
        return res.status(404).json({ message: "Income entry not found" });
      }

      res.json({ message: "Income entry deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete income entry:", error);
      res.status(500).json({ message: "Failed to delete income entry", error: error.message });
    }
  });

  // Expense routes
  app.post("/api/expenses", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { date, amount, category, description, taxDeductible, attachments } = req.body;
      const userId = req.user!.id;

      const newExpense = await db.insert(expenses).values({
        userId,
        date: new Date(date),
        amount,
        category,
        description,
        taxDeductible,
        attachments: attachments || [],
      }).returning();

      res.json({ message: "Expense created successfully", expense: newExpense[0] });
    } catch (error: any) {
      console.error("Failed to create expense:", error);
      res.status(500).json({ message: "Failed to create expense", error: error.message });
    }
  });

  app.get("/api/expenses", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const filters = expenseFilterSchema.parse(req.query);
      const userId = req.user!.id;

      let baseQuery = db.select().from(expenses);

      // Build the where conditions array
      const conditions = [eq(expenses.userId, userId)];

      if (filters.startDate && filters.endDate) {
        conditions.push(
          sql`${expenses.date} BETWEEN ${new Date(filters.startDate)} AND ${new Date(filters.endDate)}`
        );
      }

      if (filters.category) {
        conditions.push(eq(expenses.category, filters.category));
      }

      if (filters.minAmount !== undefined) {
        conditions.push(sql`CAST(${expenses.amount} AS DECIMAL) >= ${filters.minAmount}`);
      }

      if (filters.maxAmount !== undefined) {
        conditions.push(sql`CAST(${expenses.amount} AS DECIMAL) <= ${filters.maxAmount}`);
      }

      if (filters.searchTerm) {
        conditions.push(like(expenses.description, `%${filters.searchTerm}%`));
      }

      // Apply all conditions
      const results = await baseQuery
        .where(and(...conditions))
        .orderBy(desc(expenses.date));

      res.json(results);
    } catch (error: any) {
      console.error("Failed to fetch expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses", error: error.message });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { id } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const updatedExpense = await db
        .update(expenses)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(
          eq(expenses.id, parseInt(id)),
          eq(expenses.userId, userId)
        ))
        .returning();

      if (!updatedExpense.length) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json({ message: "Expense updated successfully", expense: updatedExpense[0] });
    } catch (error: any) {
      console.error("Failed to update expense:", error);
      res.status(500).json({ message: "Failed to update expense", error: error.message });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { id } = req.params;
      const userId = req.user!.id;

      const deletedExpense = await db
        .delete(expenses)
        .where(and(
          eq(expenses.id, parseInt(id)),
          eq(expenses.userId, userId)
        ))
        .returning();

      if (!deletedExpense.length) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json({ message: "Expense deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete expense:", error);
      res.status(500).json({ message: "Failed to delete expense", error: error.message });
    }
  });

  // PDF generation endpoint
  app.post("/api/generate-pdf", (req, res) => {
    try {
      // Set headers for PDF download with cross-browser support
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="invoice.pdf"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Return success
      res.status(200).json({
        message: "PDF generation endpoint ready",
        success: true
      });
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      res.status(500).json({
        message: "Failed to generate PDF",
        error: error.message,
        success: false
      });
    }
  });

  // Email sending endpoint
  app.post("/api/send-invoice", async (req, res) => {
    try {
      const { to, pdfBase64, invoiceNumber } = req.body;

      // Validate request data
      if (!to || !pdfBase64 || !invoiceNumber) {
        throw new Error("Missing required fields: to, pdfBase64, or invoiceNumber");
      }

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error("Missing email credentials in environment variables");
        return res.status(500).json({
          message: "Email service not configured",
          error: "Missing EMAIL_USER or EMAIL_PASSWORD environment variables"
        });
      }

      // Create SMTP transporter using Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        debug: true, // Enable debug output
      });

      // Verify transporter configuration
      try {
        await transporter.verify();
        console.log("SMTP connection verified successfully");
      } catch (verifyError) {
        console.error("SMTP verification failed:", verifyError);
        throw new Error("Failed to connect to email server");
      }

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `Factuur ${invoiceNumber}`,
        text: `Hierbij ontvangt u uw factuur ${invoiceNumber}.`,
        html: `
          <div>
            <p>Beste,</p>
            <p>Hierbij ontvangt u uw factuur ${invoiceNumber}.</p>
            <p>Met vriendelijke groet,</p>
          </div>
        `,
        attachments: [
          {
            filename: `factuur-${invoiceNumber}.pdf`,
            content: Buffer.from(pdfBase64, 'base64'),
            contentType: 'application/pdf',
          },
        ],
      };

      // Send email
      await transporter.sendMail(mailOptions);
      res.json({ message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Email sending failed:", error);
      res.status(500).json({
        message: "Failed to send email",
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Server error:", err);
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    });
    res.status(err.status || 500).json({
      message: err.message || 'Something broke!',
      success: false
    });
  });

  return httpServer;
}