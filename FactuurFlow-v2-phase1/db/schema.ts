import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ── Enums ────────────────────────────────────────────────────────────────────
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
]);

// ── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  // Bedrijfsinformatie
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyCity: text("company_city"),
  companyZip: text("company_zip"),
  companyCountry: text("company_country").default("Nederland"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  companyKvk: text("company_kvk"),
  companyBtw: text("company_btw"),
  companyIban: text("company_iban"),
  logoUrl: text("logo_url"),
  // Factuurinstellingen
  defaultPaymentDays: integer("default_payment_days").default(30),
  defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 2 }).default("21"),
  defaultCurrency: text("default_currency").default("USD"),
  invoicePrefix: text("invoice_prefix").default("FF"),
  // Notificaties
  emailNotifications: boolean("email_notifications").default(true),
  overdueReminders: boolean("overdue_reminders").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Ongeldig e-mailadres"),
  name: z.string().min(2, "Naam moet minimaal 2 tekens bevatten"),
  password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens bevatten"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// ── Clients ──────────────────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  zip: text("zip"),
  country: text("country").default("Nederland"),
  kvk: text("kvk"),
  btw: text("btw"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients, {
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectClientSchema = createSelectSchema(clients);
export type InsertClient = typeof clients.$inferInsert;
export type SelectClient = typeof clients.$inferSelect;

// ── Invoices ─────────────────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  clientId: integer("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  invoiceNumber: text("invoice_number").notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  issueDate: text("issue_date").notNull(), // ISO date string
  dueDate: text("due_date").notNull(),
  notes: text("notes"),
  currency: text("currency").default("EUR").notNull(),
  // Bedragen (opgeslagen als string voor precisie)
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("21").notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).default("0").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices, {
  invoiceNumber: z.string().min(1, "Factuurnummer is verplicht"),
  issueDate: z.string().min(1, "Factuurdatum is verplicht"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectInvoiceSchema = createSelectSchema(invoices);
export type InsertInvoice = typeof invoices.$inferInsert;
export type SelectInvoice = typeof invoices.$inferSelect;

// ── Invoice Items ─────────────────────────────────────────────────────────────
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems, {
  description: z.string().min(1, "Omschrijving is verplicht"),
}).omit({ id: true });

export const selectInvoiceItemSchema = createSelectSchema(invoiceItems);
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;
export type SelectInvoiceItem = typeof invoiceItems.$inferSelect;

// ── Audit Log ────────────────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: integer("resource_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SelectAuditLog = typeof auditLog.$inferSelect;

// ── Two Factor Auth ───────────────────────────────────────────────────────────
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  secret: text("secret").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  backupCodes: text("backup_codes"), // JSON array of hashed codes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Products (catalogus) ──────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("21").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products, {
  name: z.string().min(1, "Naam is verplicht"),
}).omit({ id: true, createdAt: true });

export const selectProductSchema = createSelectSchema(products);
export type InsertProduct = typeof products.$inferInsert;
export type SelectProduct = typeof products.$inferSelect;
