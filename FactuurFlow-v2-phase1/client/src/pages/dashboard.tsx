import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { fetchCurrentUser } from "@/lib/auth";
import { dashboardApi, invoicesApi, expensesApi } from "@/lib/api";
import type { InvoiceStatus } from "@/lib/api";
import { formatCurrency, getCurrencySymbol } from "@/lib/currencies";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Users,
  ArrowUpRight,
  MoreHorizontal,
  Circle,
  Loader2,
  Receipt,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Status badge ──────────────────────────────────────────────────────────────
const statusClasses: Record<InvoiceStatus, string> = {
  paid:    "bg-green-50 text-green-700",
  sent:    "bg-blue-50 text-blue-700",
  overdue: "bg-red-50 text-red-700",
  draft:   "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  const cls = statusClasses[status] ?? statusClasses.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Circle className="w-1.5 h-1.5 fill-current" />
      {t(`invoices.status.${status}`)}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  title,
  amounts,
  simpleValue,
  icon,
  iconBg,
  loading,
}: {
  title: string;
  amounts?: Record<string, number>;   // per-currency totals
  simpleValue?: string;               // plain string for counts
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
}) {
  const lines = amounts
    ? Object.entries(amounts)
        .filter(([, v]) => v > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([currency, value]) => formatCurrency(value, currency))
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <ArrowUpRight className="w-4 h-4 text-green-500 opacity-0" />
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mb-1" />
        ) : lines ? (
          lines.length === 0 ? (
            <p className="text-2xl font-bold text-gray-900">—</p>
          ) : (
            <div className="space-y-0.5">
              {lines.map((line, i) => (
                <p key={i} className={i === 0 ? "text-2xl font-bold text-gray-900" : "text-sm font-semibold text-gray-500"}>
                  {line}
                </p>
              ))}
            </div>
          )
        ) : (
          <p className="text-2xl font-bold text-gray-900">{simpleValue ?? "—"}</p>
        )}
        <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
}

// ── Fallback chart data (empty state) ─────────────────────────────────────────
function getLastSixMonths() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleString("en-US", { month: "short" }));
  }
  return months;
}
const emptyChartData = getLastSixMonths().map((month) => ({ month, omzet: 0 }));

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.stats,
    staleTime: 60_000,
  });

  const { data: recentInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: invoicesApi.list,
    staleTime: 30_000,
    select: (data) => data.slice(0, 5),
  });

  const { data: expenseStats, isLoading: expenseStatsLoading } = useQuery({
    queryKey: ["expense-stats"],
    queryFn: expensesApi.stats,
    staleTime: 60_000,
  });

  const { data: recentExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: expensesApi.list,
    staleTime: 30_000,
    select: (data: any[]) => data.slice(0, 5),
  });

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const currency = user?.defaultCurrency ?? "USD";
  const symbol = getCurrencySymbol(currency);

  // Chart shows the user's default currency; fall back to first available, then empty
  const chartData: { month: string; omzet: number }[] = (() => {
    if (!stats?.monthlyRevenue) return emptyChartData;
    const rows = stats.monthlyRevenue[currency] ?? Object.values(stats.monthlyRevenue)[0];
    return rows && rows.length > 0 ? rows : emptyChartData;
  })();

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.title")}, {firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t("dashboard.subtitle")}</p>
        </div>

        {/* Stat cards — row 1: revenue + expenses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          <StatCard
            title={t("dashboard.stats.revenue")}
            amounts={stats?.totalRevenue}
            loading={statsLoading}
            iconBg="bg-green-50"
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          />
          <StatCard
            title={t("dashboard.stats.outstanding")}
            amounts={stats?.outstanding}
            loading={statsLoading}
            iconBg="bg-orange-50"
            icon={<Clock className="w-5 h-5 text-orange-500" />}
          />
          <StatCard
            title={t("dashboard.stats.totalExpenses")}
            amounts={expenseStats?.totalExpenses}
            loading={expenseStatsLoading}
            iconBg="bg-red-50"
            icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          />
          <StatCard
            title={t("dashboard.stats.pendingBills")}
            amounts={expenseStats?.pendingBills}
            loading={expenseStatsLoading}
            iconBg="bg-yellow-50"
            icon={<Receipt className="w-5 h-5 text-yellow-600" />}
          />
        </div>

        {/* Stat cards — row 2: counts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <StatCard
            title={t("dashboard.stats.invoices")}
            simpleValue={stats ? String(stats.invoiceCount) : "—"}
            loading={statsLoading}
            iconBg="bg-blue-50"
            icon={<FileText className="w-5 h-5 text-blue-500" />}
          />
          <StatCard
            title={t("dashboard.stats.clients")}
            simpleValue={stats ? String(stats.clientCount) : "—"}
            loading={statsLoading}
            iconBg="bg-purple-50"
            icon={<Users className="w-5 h-5 text-purple-500" />}
          />
        </div>

        {/* Chart + recent invoices */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
          {/* Revenue chart */}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-gray-900">{t("dashboard.revenueChartTitle")}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{t("dashboard.revenueChartPeriod")}</p>
              </div>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="omzetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v === 0 ? `${symbol}0` : `${symbol}${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  fill="url(#omzetGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#16a34a", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent invoices */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">{t("dashboard.recentInvoices")}</h2>
              <button
                onClick={() => navigate("/invoices")}
                className="text-xs text-green-600 font-medium hover:underline"
              >
                {t("dashboard.viewAll")}
              </button>
            </div>

            {invoicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">{t("dashboard.noInvoices")}</p>
                <button
                  onClick={() => navigate("/invoices/new")}
                  className="mt-3 text-xs text-green-600 font-medium hover:underline"
                >
                  {t("dashboard.noInvoicesHint")} →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {inv.clientName ?? t("invoices.noClient")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {inv.invoiceNumber} · {inv.issueDate}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(inv.total), inv.currency)}
                      </p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent expenses */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{t("dashboard.recentExpenses")}</h2>
            <button
              onClick={() => navigate("/expenses")}
              className="text-xs text-green-600 font-medium hover:underline"
            >
              {t("dashboard.viewAllExpenses")}
            </button>
          </div>

          {expensesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">{t("dashboard.noExpenses")}</p>
              <button
                onClick={() => navigate("/expenses/new")}
                className="mt-3 text-xs text-green-600 font-medium hover:underline"
              >
                {t("dashboard.noExpensesHint")} →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentExpenses.map((exp: any) => (
                <div key={exp.id} className="flex items-center gap-4 py-3">
                  <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{exp.vendorName}</p>
                    <p className="text-xs text-gray-400">
                      {exp.category || "—"} · {exp.issueDate}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-red-600">
                      -{formatCurrency(Number(exp.total), exp.currency)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      exp.status === "paid"    ? "bg-green-50 text-green-700" :
                      exp.status === "overdue" ? "bg-red-50 text-red-700" :
                                                 "bg-yellow-50 text-yellow-700"
                    }`}>
                      {exp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
