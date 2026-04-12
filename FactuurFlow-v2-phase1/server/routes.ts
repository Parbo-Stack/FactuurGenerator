import type { Express } from "express";
import { createServer, type Server } from "http";
import { Resend } from "resend";
import passport from "passport";
import { db } from "@db";
import {
  users,
  clients,
  invoices,
  invoiceItems,
  auditLog,
  insertUserSchema,
  insertClientSchema,
  insertInvoiceSchema,
} from "@db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { hashPassword, comparePassword } from "./auth";
import { logAudit } from "./audit";
import { z } from "zod";

// ── Auth guard ────────────────────────────────────────────────────────────────
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Niet ingelogd." });
}

function uid(req: any): number {
  return (req.user as any).id;
}

export function registerRoutes(app: Express): Server {
  // ══════════════════════════════════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════════════════════════════════

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema
        .pick({ email: true, name: true, password: true })
        .safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: parsed.error.errors[0].message });

      const { email, name, password } = parsed.data;
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));
      if (existing)
        return res.status(409).json({ message: "E-mailadres is al in gebruik." });

      const [user] = await db
        .insert(users)
        .values({ email: email.toLowerCase(), name, password: hashPassword(password) })
        .returning();

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Inloggen na registratie mislukt." });
        logAudit(req, "register", { userId: user.id });
        const { password: _, ...safe } = user;
        res.status(201).json({ user: safe });
      });
    } catch (err: any) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Registratie mislukt." });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        logAudit(req, "login_failed", { metadata: { email: req.body.email } });
        return res.status(401).json({ message: info?.message ?? "Inloggen mislukt." });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        logAudit(req, "login", { userId: user.id });
        const { password: _, ...safe } = user;
        res.json({ user: safe });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    const userId = (req.user as any)?.id;
    logAudit(req, "logout", { userId });
    req.logout(() => res.json({ message: "Uitgelogd." }));
  });

  // POST /api/auth/change-password
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword)
        return res.status(400).json({ message: "Verplichte velden ontbreken." });
      if (newPassword.length < 8)
        return res.status(400).json({ message: "Nieuw wachtwoord minimaal 8 tekens." });

      const [user] = await db.select().from(users).where(eq(users.id, uid(req)));
      if (!comparePassword(currentPassword, user.password))
        return res.status(401).json({ message: "Huidig wachtwoord is onjuist." });

      await db
        .update(users)
        .set({ password: hashPassword(newPassword), updatedAt: new Date() })
        .where(eq(users.id, uid(req)));

      logAudit(req, "password_changed", { userId: uid(req) });
      res.json({ message: "Wachtwoord gewijzigd." });
    } catch (err: any) {
      console.error("Change password error:", err);
      res.status(500).json({ message: "Wachtwoord wijzigen mislukt." });
    }
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password: _, ...safe } = req.user as any;
    res.json({ user: safe });
  });

  // PATCH /api/auth/me — profiel + bedrijf bijwerken
  app.patch("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const allowed = [
        "name", "companyName", "companyAddress", "companyCity", "companyZip",
        "companyCountry", "companyPhone", "companyEmail", "companyKvk",
        "companyBtw", "companyIban", "logoUrl", "defaultPaymentDays",
        "defaultTaxRate", "defaultCurrency", "invoicePrefix", "emailNotifications", "overdueReminders",
      ];
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (key in req.body) updates[key] = req.body[key];
      }
      if (Object.keys(updates).length === 0)
        return res.status(400).json({ message: "Geen wijzigingen opgegeven." });

      updates.updatedAt = new Date();
      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, uid(req)))
        .returning();

      const { password: _, ...safe } = updated;
      res.json({ user: safe });
    } catch (err: any) {
      console.error("Update me error:", err);
      res.status(500).json({ message: "Profiel bijwerken mislukt." });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = uid(req);

      const [totalRevenue] = await db
        .select({ value: sql<string>`coalesce(sum(total), 0)` })
        .from(invoices)
        .where(and(eq(invoices.userId, userId), eq(invoices.status, "paid")));

      const [outstanding] = await db
        .select({ value: sql<string>`coalesce(sum(total), 0)` })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            inArray(invoices.status, ["sent", "overdue"])
          )
        );

      const [invoiceCount] = await db
        .select({ value: sql<string>`count(*)` })
        .from(invoices)
        .where(eq(invoices.userId, userId));

      const [clientCount] = await db
        .select({ value: sql<string>`count(*)` })
        .from(clients)
        .where(eq(clients.userId, userId));

      // Maandomzet (afgelopen 6 maanden)
      const monthlyRevenue = await db
        .select({
          month: sql<string>`to_char(created_at, 'Mon')`,
          omzet: sql<string>`coalesce(sum(total), 0)`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            eq(invoices.status, "paid"),
            sql`created_at >= now() - interval '6 months'`
          )
        )
        .groupBy(sql`to_char(created_at, 'Mon'), date_trunc('month', created_at)`)
        .orderBy(sql`date_trunc('month', created_at)`);

      res.json({
        totalRevenue: Number(totalRevenue.value),
        outstanding: Number(outstanding.value),
        invoiceCount: Number(invoiceCount.value),
        clientCount: Number(clientCount.value),
        monthlyRevenue: monthlyRevenue.map((r) => ({
          month: r.month,
          omzet: Number(r.omzet),
        })),
      });
    } catch (err: any) {
      console.error("Dashboard stats error:", err);
      res.status(500).json({ message: "Statistieken ophalen mislukt." });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // CLIENTS
  // ══════════════════════════════════════════════════════════════════

  // GET /api/clients
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const rows = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, uid(req)))
        .orderBy(desc(clients.createdAt));
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: "Klanten ophalen mislukt." });
    }
  });

  // GET /api/clients/:id
  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, Number(req.params.id)), eq(clients.userId, uid(req))));
      if (!client) return res.status(404).json({ message: "Klant niet gevonden." });
      res.json(client);
    } catch (err: any) {
      res.status(500).json({ message: "Klant ophalen mislukt." });
    }
  });

  // POST /api/clients
  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const parsed = insertClientSchema.safeParse({ ...req.body, userId: uid(req) });
      if (!parsed.success)
        return res.status(400).json({ message: parsed.error.errors[0].message });

      const [client] = await db.insert(clients).values(parsed.data).returning();
      logAudit(req, "client_created", { userId: uid(req), resource: "client", resourceId: client.id });
      res.status(201).json(client);
    } catch (err: any) {
      console.error("Create client error:", err);
      res.status(500).json({ message: "Klant aanmaken mislukt." });
    }
  });

  // PUT /api/clients/:id
  app.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const [existing] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, Number(req.params.id)), eq(clients.userId, uid(req))));
      if (!existing) return res.status(404).json({ message: "Klant niet gevonden." });

      const [updated] = await db
        .update(clients)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(clients.id, Number(req.params.id)))
        .returning();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: "Klant bijwerken mislukt." });
    }
  });

  // DELETE /api/clients/:id
  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const [existing] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, Number(req.params.id)), eq(clients.userId, uid(req))));
      if (!existing) return res.status(404).json({ message: "Klant niet gevonden." });

      await db.delete(clients).where(eq(clients.id, Number(req.params.id)));
      logAudit(req, "client_deleted", { userId: uid(req), resource: "client", resourceId: existing.id });
      res.json({ message: "Klant verwijderd." });
    } catch (err: any) {
      res.status(500).json({ message: "Klant verwijderen mislukt." });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // INVOICES
  // ══════════════════════════════════════════════════════════════════

  // GET /api/invoices — met klantnaam erbij
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const rows = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          subtotal: invoices.subtotal,
          taxRate: invoices.taxRate,
          taxAmount: invoices.taxAmount,
          discount: invoices.discount,
          total: invoices.total,
          currency: invoices.currency,
          paidAt: invoices.paidAt,
          createdAt: invoices.createdAt,
          clientId: invoices.clientId,
          clientName: clients.name,
          clientEmail: clients.email,
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(eq(invoices.userId, uid(req)))
        .orderBy(desc(invoices.createdAt));
      res.json(rows);
    } catch (err: any) {
      console.error("Get invoices error:", err);
      res.status(500).json({ message: "Facturen ophalen mislukt." });
    }
  });

  // GET /api/invoices/:id — met items + klant
  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, Number(req.params.id)), eq(invoices.userId, uid(req))));
      if (!invoice) return res.status(404).json({ message: "Factuur niet gevonden." });

      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id))
        .orderBy(invoiceItems.sortOrder);

      let client = null;
      if (invoice.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, invoice.clientId));
        client = c ?? null;
      }

      res.json({ ...invoice, items, client });
    } catch (err: any) {
      res.status(500).json({ message: "Factuur ophalen mislukt." });
    }
  });

  // POST /api/invoices
  const createInvoiceSchema = insertInvoiceSchema.omit({ userId: true }).extend({
    // numeric velden accepteren zowel string als number (coerce naar string voor DB)
    taxRate: z.coerce.string().optional(),
    discount: z.coerce.string().optional(),
    subtotal: z.coerce.string().optional(),
    taxAmount: z.coerce.string().optional(),
    total: z.coerce.string().optional(),
    items: z
      .array(
        z.object({
          description: z.string().min(1, "Omschrijving is verplicht"),
          quantity: z.coerce.number().min(0),
          unitPrice: z.coerce.number().min(0),
          sortOrder: z.number().optional(),
        })
      )
      .min(1, "Minimaal één regel vereist"),
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const parsed = createInvoiceSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: parsed.error.errors[0].message });

      const { items, ...invoiceData } = parsed.data;

      // Bereken totalen
      const subtotal = items.reduce(
        (s: number, i) => s + i.quantity * i.unitPrice,
        0
      );
      const taxRate = Number(invoiceData.taxRate ?? 21);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount - Number(invoiceData.discount ?? 0);

      const [invoice] = await db
        .insert(invoices)
        .values({
          ...invoiceData,
          userId: uid(req),
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
        })
        .returning();

      // Items invoegen
      const insertedItems = await db
        .insert(invoiceItems)
        .values(
          items.map((item, idx) => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            amount: (item.quantity * item.unitPrice).toFixed(2),
            sortOrder: item.sortOrder ?? idx,
          }))
        )
        .returning();

      logAudit(req, "invoice_created", { userId: uid(req), resource: "invoice", resourceId: invoice.id });
      res.status(201).json({ ...invoice, items: insertedItems });
    } catch (err: any) {
      console.error("Create invoice error:", err);
      res.status(500).json({ message: "Factuur aanmaken mislukt." });
    }
  });

  // PUT /api/invoices/:id
  app.put("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const [existing] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, Number(req.params.id)), eq(invoices.userId, uid(req))));
      if (!existing) return res.status(404).json({ message: "Factuur niet gevonden." });

      const { items, ...invoiceData } = req.body;

      // Herbereken totalen indien items meegestuurd
      let totals: Record<string, string> = {};
      if (items?.length) {
        const subtotal = items.reduce(
          (s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice),
          0
        );
        const taxRate = Number(invoiceData.taxRate ?? existing.taxRate ?? 21);
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount - Number(invoiceData.discount ?? existing.discount ?? 0);
        totals = {
          subtotal: String(subtotal.toFixed(2)),
          taxAmount: String(taxAmount.toFixed(2)),
          total: String(total.toFixed(2)),
        };

        // Verwijder oude items en zet nieuwe
        await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, existing.id));
        await db.insert(invoiceItems).values(
          items.map((item: any, idx: number) => ({
            ...item,
            invoiceId: existing.id,
            amount: String((Number(item.quantity) * Number(item.unitPrice)).toFixed(2)),
            sortOrder: idx,
          }))
        );
      }

      const [updated] = await db
        .update(invoices)
        .set({ ...invoiceData, ...totals, updatedAt: new Date() })
        .where(eq(invoices.id, existing.id))
        .returning();

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: "Factuur bijwerken mislukt." });
    }
  });

  // PATCH /api/invoices/:id/status
  app.patch("/api/invoices/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ["draft", "sent", "paid", "overdue"];
      if (!validStatuses.includes(status))
        return res.status(400).json({ message: "Ongeldige status." });

      const [existing] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, Number(req.params.id)), eq(invoices.userId, uid(req))));
      if (!existing) return res.status(404).json({ message: "Factuur niet gevonden." });

      const [updated] = await db
        .update(invoices)
        .set({
          status,
          paidAt: status === "paid" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, existing.id))
        .returning();

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: "Status bijwerken mislukt." });
    }
  });

  // DELETE /api/invoices/:id
  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const [existing] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, Number(req.params.id)), eq(invoices.userId, uid(req))));
      if (!existing) return res.status(404).json({ message: "Factuur niet gevonden." });

      await db.delete(invoices).where(eq(invoices.id, existing.id));
      logAudit(req, "invoice_deleted", { userId: uid(req), resource: "invoice", resourceId: existing.id });
      res.json({ message: "Factuur verwijderd." });
    } catch (err: any) {
      res.status(500).json({ message: "Factuur verwijderen mislukt." });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // E-MAIL
  // ══════════════════════════════════════════════════════════════════

  app.post("/api/send-invoice", requireAuth, async (req, res) => {
    try {
      const { to, pdfBase64, invoiceNumber, fromName } = req.body;
      if (!to || !pdfBase64 || !invoiceNumber)
        return res.status(400).json({ message: "Verplichte velden ontbreken: to, pdfBase64 of invoiceNumber." });

      if (!process.env.RESEND_API_KEY)
        return res.status(500).json({ message: "RESEND_API_KEY niet ingesteld in .env." });

      const resend = new Resend(process.env.RESEND_API_KEY);
      const senderName = fromName || "FactuurFlow";

      const { error } = await resend.emails.send({
        from: `${senderName} <facturen@factuurflow.com>`,
        to: [to],
        subject: `Factuur ${invoiceNumber}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#374151">
            <p>Beste,</p>
            <p>Hierbij ontvangt u factuur <strong>${invoiceNumber}</strong>.</p>
            <p>De factuur is bijgevoegd als PDF. Heeft u vragen? Neem dan gerust contact op.</p>
            <p style="margin-top:24px">Met vriendelijke groet,<br/><strong>${senderName}</strong></p>
          </div>
        `,
        attachments: [
          {
            filename: `factuur-${invoiceNumber}.pdf`,
            content: pdfBase64,
          },
        ],
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ message: error.message ?? "Versturen mislukt via Resend." });
      }

      logAudit(req, "invoice_sent", { userId: uid(req), resource: "invoice", metadata: { to, invoiceNumber } });
      res.json({ message: "E-mail verzonden." });
    } catch (err: any) {
      console.error("Send invoice email error:", err);
      res.status(500).json({ message: "E-mail verzenden mislukt." });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // AUDIT LOG
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/audit-log", requireAuth, async (req, res) => {
    try {
      const rows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.userId, uid(req)))
        .orderBy(desc(auditLog.createdAt))
        .limit(100);
      res.json(rows);
    } catch (err: any) {
      console.error("Audit log error:", err);
      res.status(500).json({ message: "Activiteitenlog ophalen mislukt." });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // HTTP SERVER
  // ══════════════════════════════════════════════════════════════════

  const httpServer = createServer(app);

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("Server error:", err);
    res.status(err.status || 500).json({ message: err.message || "Serverfout." });
  });

  return httpServer;
}
