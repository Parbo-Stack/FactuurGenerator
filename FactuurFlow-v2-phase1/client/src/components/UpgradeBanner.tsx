import { useState } from "react";
import { useLocation } from "wouter";
import { X, ArrowUpRight, AlertTriangle } from "lucide-react";
import { TIERS } from "@/lib/tiers";
import type { TierKey } from "@/lib/tiers";

interface Props {
  resource: "clients" | "invoices" | "expenses";
  current: number;
  limit: number;
  tier: TierKey;
}

const RESOURCE_LABELS: Record<Props["resource"], string> = {
  clients:  "client",
  invoices: "invoice",
  expenses: "expense",
};

const RESOURCE_BENEFITS: Record<Props["resource"], string> = {
  clients:  "25 clients and unlimited invoices",
  invoices: "unlimited invoices every month",
  expenses: "unlimited expense tracking",
};

export function UpgradeBanner({ resource, current, limit, tier }: Props) {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const nextTier = tier === "free" ? TIERS.pro : TIERS.business;
  const label = RESOURCE_LABELS[resource];
  const benefit = RESOURCE_BENEFITS[resource];

  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          {label.charAt(0).toUpperCase() + label.slice(1)} limit reached ({current}/{limit})
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Upgrade to {nextTier.name} to get {benefit}.
        </p>
        <button
          onClick={() => navigate("/pricing")}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 transition"
        >
          View pricing <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-amber-400 hover:text-amber-600 rounded transition flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
