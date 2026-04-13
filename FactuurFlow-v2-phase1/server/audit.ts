import { db } from "../db";
import { auditLog } from "../db/schema";
import type { Request } from "express";

export type AuditAction =
  | "login"
  | "logout"
  | "login_failed"
  | "register"
  | "password_changed"
  | "invoice_created"
  | "invoice_deleted"
  | "invoice_sent"
  | "invoice_status_changed"
  | "client_created"
  | "client_deleted"
  | "settings_updated"
  | "expense_created"
  | "expense_deleted";

export async function logAudit(
  req: Request,
  action: AuditAction,
  options: {
    userId?: number;
    resource?: string;
    resourceId?: number;
    metadata?: Record<string, unknown>;
  } = {}
) {
  try {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";

    await db.insert(auditLog).values({
      userId: options.userId ?? null,
      action,
      resource: options.resource ?? null,
      resourceId: options.resourceId ?? null,
      ipAddress: ip,
      userAgent: req.headers["user-agent"] ?? null,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null,
    });
  } catch (err) {
    // Audit logging should never break the main request
    console.error("[audit] Failed to write audit log:", err);
  }
}
