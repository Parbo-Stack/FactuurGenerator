import { useLocation } from "wouter";
import { Check } from "lucide-react";
import { TIERS } from "@/lib/tiers";
import type { TierKey } from "@/lib/tiers";

const TIER_KEYS: TierKey[] = ["free", "pro", "business"];

const FAQ = [
  {
    q: "Can I upgrade or downgrade anytime?",
    a: "Yes, plan changes take effect immediately. Your data is always preserved.",
  },
  {
    q: "Is there a free trial?",
    a: "Our Starter plan is free forever — no credit card required. Upgrade only when you need more.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Coming soon: credit card via Stripe. We'll notify you when payments go live.",
  },
  {
    q: "What happens when I hit a limit?",
    a: "You'll see a prompt to upgrade. Existing data is never deleted — you just can't add more until you upgrade.",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">FactuurFlow</span>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            ← Back to app
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500">
            Start free, upgrade when you grow
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TIER_KEYS.map((key) => {
            const tier = TIERS[key];
            const isPro = key === "pro";
            const isFree = key === "free";

            return (
              <div
                key={key}
                className={`relative bg-white rounded-2xl border p-8 flex flex-col ${
                  isPro
                    ? "border-green-500 shadow-lg shadow-green-100 ring-2 ring-green-500"
                    : "border-gray-200"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{tier.name}</h2>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${tier.price}
                    </span>
                    <span className="text-sm text-gray-400 mb-1.5">/month</span>
                  </div>
                </div>

                {/* Limits */}
                <div className="mb-6 space-y-1.5 text-sm">
                  <p className="text-gray-500">
                    <span className="font-semibold text-gray-800">
                      {tier.limits.clients === -1 ? "Unlimited" : tier.limits.clients}
                    </span>{" "}
                    clients
                  </p>
                  <p className="text-gray-500">
                    <span className="font-semibold text-gray-800">
                      {tier.limits.invoicesPerMonth === -1 ? "Unlimited" : tier.limits.invoicesPerMonth}
                    </span>{" "}
                    invoices / month
                  </p>
                  <p className="text-gray-500">
                    <span className="font-semibold text-gray-800">
                      {tier.limits.expensesPerMonth === -1 ? "Unlimited" : tier.limits.expensesPerMonth}
                    </span>{" "}
                    expenses / month
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate(isFree ? "/register" : "/pricing")}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                    isPro
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : isFree
                      ? "bg-gray-900 hover:bg-gray-800 text-white"
                      : "border-2 border-gray-200 hover:border-green-500 text-gray-700 hover:text-green-700"
                  }`}
                >
                  {isFree
                    ? "Get started free"
                    : key === "pro"
                    ? "Upgrade to Professional"
                    : "Upgrade to Business"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust line */}
        <p className="text-center text-sm text-gray-400 mb-16">
          All plans include 20 currencies, PDF invoices, and SSL security
        </p>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-8 border-t border-gray-100">
        © {new Date().getFullYear()} FactuurFlow
      </footer>
    </div>
  );
}
