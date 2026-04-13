import { db } from "@db";
import { users, usageTracking, clients, invoices, expenses } from "@db/schema";
import { eq, and, count } from "drizzle-orm";
import { TIERS, type TierKey } from "../client/src/lib/tiers";

export async function checkLimit(
  userId: number,
  resource: "clients" | "invoicesPerMonth" | "expensesPerMonth"
): Promise<{ allowed: boolean; current: number; limit: number; tier: TierKey }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const tier = (user?.subscriptionTier ?? "free") as TierKey;
  const limit = TIERS[tier].limits[resource];

  if (limit === -1) return { allowed: true, current: 0, limit: -1, tier };

  let current = 0;
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (resource === "clients") {
    const [result] = await db
      .select({ value: count() })
      .from(clients)
      .where(eq(clients.userId, userId));
    current = Number(result.value);
  } else if (resource === "invoicesPerMonth") {
    const [usage] = await db
      .select()
      .from(usageTracking)
      .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, currentMonth)));
    current = usage?.invoicesCreated ?? 0;
  } else if (resource === "expensesPerMonth") {
    const [usage] = await db
      .select()
      .from(usageTracking)
      .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, currentMonth)));
    current = usage?.expensesCreated ?? 0;
  }

  return { allowed: current < limit, current, limit, tier };
}

export async function incrementUsage(
  userId: number,
  resource: "invoicesCreated" | "expensesCreated"
): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [existing] = await db
    .select()
    .from(usageTracking)
    .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, currentMonth)));

  if (existing) {
    await db
      .update(usageTracking)
      .set({ [resource]: (existing[resource] ?? 0) + 1, updatedAt: new Date() })
      .where(eq(usageTracking.id, existing.id));
  } else {
    await db.insert(usageTracking).values({
      userId,
      month: currentMonth,
      [resource]: 1,
    });
  }
}
