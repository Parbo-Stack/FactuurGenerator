export const TIERS = {
  free: {
    name: "Starter",
    price: 0,
    limits: {
      clients: 3,
      invoicesPerMonth: 5,
      expensesPerMonth: 5,
    },
    features: [
      "PDF download",
      "20 currencies",
      "Basic dashboard",
      "Email support",
    ],
  },
  pro: {
    name: "Professional",
    price: 9,
    limits: {
      clients: 25,
      invoicesPerMonth: -1,   // -1 = unlimited
      expensesPerMonth: -1,
    },
    features: [
      "Everything in Starter",
      "Send invoices by email",
      "PDF expense upload",
      "Client management",
      "Activity log",
      "Priority support",
    ],
  },
  business: {
    name: "Business",
    price: 19,
    limits: {
      clients: -1,
      invoicesPerMonth: -1,
      expensesPerMonth: -1,
    },
    features: [
      "Everything in Professional",
      "Unlimited clients",
      "Advanced audit log",
      "Data export (CSV)",
      "API access (coming soon)",
      "Dedicated support",
    ],
  },
} as const;

export type TierKey = keyof typeof TIERS;

export function getTierLimit(tier: TierKey, limit: keyof typeof TIERS.free.limits): number {
  return TIERS[tier].limits[limit];
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}
