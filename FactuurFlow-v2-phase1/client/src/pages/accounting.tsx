import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { invoicesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/currencies";
import { Download, FileText, Receipt, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Expense {
  id: number;
  vendorName: string;
  invoiceNumber: string | null;
  category: string | null;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  status: string;
  notes: string | null;
}

async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetch("/api/expenses", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load expenses");
  return res.json();
}

// ── CSV helpers ───────────────────────────────────────────────────────────────
function escapeCsv(val: string | null | undefined): string {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function downloadCsv(filename: string, headers: string[], rows: (string | null | undefined)[][]) {
  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Year options ──────────────────────────────────────────────────────────────
function getYears(dates: string[]): number[] {
  const years = new Set(dates.map((d) => new Date(d).getFullYear()).filter(Boolean));
  return Array.from(years).sort((a, b) => b - a);
}

// ── P&L summary card ─────────────────────────────────────────────────────────
function PLCard({
  label,
  amounts,
  color,
  icon,
}: {
  label: string;
  amounts: Record<string, number>;
  color: string;
  icon: React.ReactNode;
}) {
  const entries = Object.entries(amounts).filter(([, v]) => v !== 0);
  return (
    <div className={`bg-white rounded-2xl border p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-xl font-bold text-gray-400">—</p>
      ) : (
        <div className="space-y-0.5">
          {entries.map(([cur, val], i) => (
            <p key={cur} className={i === 0 ? "text-2xl font-bold text-gray-900" : "text-sm font-semibold text-gray-500"}>
              {formatCurrency(val, cur)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AccountingPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number | "all">(currentYear);
  const [tab, setTab] = useState<"revenue" | "expenses">("revenue");

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: invoicesApi.list,
  });

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  // Available years from both datasets
  const allYears = useMemo(() => {
    const dates = [
      ...invoices.map((i) => i.issueDate),
      ...expenses.map((e) => e.issueDate),
    ];
    return getYears(dates);
  }, [invoices, expenses]);

  // Filter by selected year
  const filteredInvoices = useMemo(() =>
    invoices.filter((inv) =>
      year === "all" || new Date(inv.issueDate).getFullYear() === year
    ), [invoices, year]);

  const filteredExpenses = useMemo(() =>
    expenses.filter((exp) =>
      year === "all" || new Date(exp.issueDate).getFullYear() === year
    ), [expenses, year]);

  // P&L totals per currency
  const plTotals = useMemo(() => {
    const revenue: Record<string, number> = {};
    const expTotal: Record<string, number> = {};

    for (const inv of filteredInvoices) {
      if (inv.status === "paid") {
        revenue[inv.currency] = (revenue[inv.currency] ?? 0) + Number(inv.total);
      }
    }
    for (const exp of filteredExpenses) {
      expTotal[exp.currency] = (expTotal[exp.currency] ?? 0) + Number(exp.total);
    }

    // Net per currency (only currencies that appear in both or either)
    const allCurrencies = Array.from(new Set([...Object.keys(revenue), ...Object.keys(expTotal)]));
    const net: Record<string, number> = {};
    for (const cur of allCurrencies) {
      net[cur] = (revenue[cur] ?? 0) - (expTotal[cur] ?? 0);
    }

    return { revenue, expenses: expTotal, net };
  }, [filteredInvoices, filteredExpenses]);

  // CSV exports
  function exportRevenueCsv() {
    downloadCsv(
      `revenue-${year}.csv`,
      ["Date", "Invoice #", "Client", "Currency", "Subtotal", "VAT", "Total", "Status"],
      filteredInvoices.map((inv) => [
        inv.issueDate,
        inv.invoiceNumber,
        inv.clientName ?? "",
        inv.currency,
        inv.subtotal,
        inv.taxAmount,
        inv.total,
        inv.status,
      ])
    );
  }

  function exportExpensesCsv() {
    downloadCsv(
      `expenses-${year}.csv`,
      ["Date", "Vendor", "Invoice #", "Category", "Currency", "Subtotal", "Tax", "Total", "Status"],
      filteredExpenses.map((exp) => [
        exp.issueDate,
        exp.vendorName,
        exp.invoiceNumber ?? "",
        exp.category ?? "",
        exp.currency,
        exp.subtotal,
        exp.taxAmount,
        exp.total,
        exp.status,
      ])
    );
  }

  const invoiceStatusCls: Record<string, string> = {
    paid:    "bg-green-50 text-green-700",
    sent:    "bg-blue-50 text-blue-700",
    overdue: "bg-red-50 text-red-700",
    draft:   "bg-gray-100 text-gray-500",
  };
  const expenseStatusCls: Record<string, string> = {
    paid:    "bg-green-50 text-green-700",
    pending: "bg-yellow-50 text-yellow-700",
    overdue: "bg-red-50 text-red-700",
  };

  const isLoading = invLoading || expLoading;

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
            <p className="text-sm text-gray-500 mt-0.5">Revenue & expense overview with export</p>
          </div>
          {/* Year filter */}
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="all">All years</option>
              {allYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* P&L summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <PLCard
            label="Total Revenue (paid)"
            amounts={plTotals.revenue}
            color="border-green-100"
            icon={<TrendingUp className="w-4 h-4 text-green-600" />}
          />
          <PLCard
            label="Total Expenses"
            amounts={plTotals.expenses}
            color="border-red-100"
            icon={<TrendingDown className="w-4 h-4 text-red-500" />}
          />
          <PLCard
            label="Net Profit / Loss"
            amounts={plTotals.net}
            color="border-gray-100"
            icon={<Minus className="w-4 h-4 text-gray-500" />}
          />
        </div>

        {/* Tabs + export */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-0 border-b border-gray-100">
            <div className="flex gap-1">
              <button
                onClick={() => setTab("revenue")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition ${
                  tab === "revenue"
                    ? "border-green-600 text-green-700 bg-green-50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Revenue ({filteredInvoices.length})
              </button>
              <button
                onClick={() => setTab("expenses")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition ${
                  tab === "expenses"
                    ? "border-red-500 text-red-700 bg-red-50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Expenses ({filteredExpenses.length})
              </button>
            </div>
            <div className="pb-3">
              <button
                onClick={tab === "revenue" ? exportRevenueCsv : exportExpensesCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
          ) : tab === "revenue" ? (
            /* ── Revenue table ── */
            filteredInvoices.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                No invoices for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Date</th>
                      <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                      <th className="text-left px-4 py-3 font-medium">Client</th>
                      <th className="text-left px-4 py-3 font-medium">Currency</th>
                      <th className="text-right px-4 py-3 font-medium">Subtotal</th>
                      <th className="text-right px-4 py-3 font-medium">VAT</th>
                      <th className="text-right px-4 py-3 font-medium">Total</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{inv.issueDate}</td>
                        <td className="px-4 py-3 font-mono text-gray-700">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{inv.clientName || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{inv.currency}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(Number(inv.subtotal), inv.currency)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(Number(inv.taxAmount), inv.currency)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(Number(inv.total), inv.currency)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${invoiceStatusCls[inv.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Totals</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        {Object.entries(
                          filteredInvoices.reduce((acc, inv) => {
                            acc[inv.currency] = (acc[inv.currency] ?? 0) + Number(inv.subtotal);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([cur, val]) => (
                          <div key={cur}>{formatCurrency(val, cur)}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-500">
                        {Object.entries(
                          filteredInvoices.reduce((acc, inv) => {
                            acc[inv.currency] = (acc[inv.currency] ?? 0) + Number(inv.taxAmount);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([cur, val]) => (
                          <div key={cur}>{formatCurrency(val, cur)}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-green-700">
                        {Object.entries(
                          filteredInvoices.reduce((acc, inv) => {
                            acc[inv.currency] = (acc[inv.currency] ?? 0) + Number(inv.total);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([cur, val]) => (
                          <div key={cur}>{formatCurrency(val, cur)}</div>
                        ))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          ) : (
            /* ── Expenses table ── */
            filteredExpenses.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                No expenses for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Date</th>
                      <th className="text-left px-4 py-3 font-medium">Vendor</th>
                      <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                      <th className="text-left px-4 py-3 font-medium">Category</th>
                      <th className="text-left px-4 py-3 font-medium">Currency</th>
                      <th className="text-right px-4 py-3 font-medium">Subtotal</th>
                      <th className="text-right px-4 py-3 font-medium">Tax</th>
                      <th className="text-right px-4 py-3 font-medium">Total</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{exp.issueDate}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{exp.vendorName}</td>
                        <td className="px-4 py-3 font-mono text-gray-500">{exp.invoiceNumber || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{exp.category || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{exp.currency}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(Number(exp.subtotal), exp.currency)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(Number(exp.taxAmount), exp.currency)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-700">{formatCurrency(Number(exp.total), exp.currency)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${expenseStatusCls[exp.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {exp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={5} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Totals</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        {Object.entries(
                          filteredExpenses.reduce((acc, exp) => {
                            acc[exp.currency] = (acc[exp.currency] ?? 0) + Number(exp.subtotal);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([cur, val]) => (
                          <div key={cur}>{formatCurrency(val, cur)}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-500">
                        {Object.entries(
                          filteredExpenses.reduce((acc, exp) => {
                            acc[exp.currency] = (acc[exp.currency] ?? 0) + Number(exp.taxAmount);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([cur, val]) => (
                          <div key={cur}>{formatCurrency(val, cur)}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-red-700">
                        {Object.entries(
                          filteredExpenses.reduce((acc, exp) => {
                            acc[exp.currency] = (acc[exp.currency] ?? 0) + Number(exp.total);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([cur, val]) => (
                          <div key={cur}>{formatCurrency(val, cur)}</div>
                        ))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </AppLayout>
  );
}
