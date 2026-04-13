import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency } from "@/lib/currencies";
import { PdfUploadModal } from "@/components/PdfUploadModal";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Search, Circle, MoreHorizontal, Trash2, Check, Clock, AlertCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Expense {
  id: number;
  userId: number;
  vendorName: string;
  vendorEmail: string | null;
  invoiceNumber: string | null;
  status: "pending" | "paid" | "overdue";
  issueDate: string;
  dueDate: string | null;
  currency: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  category: string | null;
  notes: string | null;
  pdfData: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ── API helpers ────────────────────────────────────────────────────────────────
async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetch("/api/expenses", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load expenses");
  return res.json();
}

async function deleteExpense(id: number) {
  const res = await fetch(`/api/expenses/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Failed to delete expense");
}

async function updateStatus(id: number, status: string) {
  const res = await fetch(`/api/expenses/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

// ── Status config ──────────────────────────────────────────────────────────────
const statusConfig = {
  pending: { label: "Pending",  badge: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  paid:    { label: "Paid",     badge: "bg-green-50 text-green-700 border-green-200",   icon: Check },
  overdue: { label: "Overdue",  badge: "bg-red-50 text-red-700 border-red-200",         icon: AlertCircle },
};

type Tab = "all" | "pending" | "paid" | "overdue";

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  const deleteMut = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); },
    onError: () => toast({ title: "Error", description: "Could not delete expense.", variant: "destructive" }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); },
  });

  const filtered = expenses.filter((e) => {
    if (tab !== "all" && e.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.vendorName.toLowerCase().includes(q) || (e.invoiceNumber ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "all",     label: "All" },
    { key: "pending", label: "Pending" },
    { key: "paid",    label: "Paid" },
    { key: "overdue", label: "Overdue" },
  ];

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500 mt-0.5">{expenses.length} bills total</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <Upload className="w-4 h-4" />
              Upload PDF
            </button>
            <button
              onClick={() => navigate("/expenses/new")}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-4 px-5 pt-4 pb-0 border-b border-gray-100">
            <div className="flex gap-1 flex-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px ${
                    tab === t.key
                      ? "border-green-600 text-green-700 bg-green-50"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative pb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-3 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor or invoice #…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">
                {search ? "No expenses found." : "No expenses yet. Add your first bill."}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Due date</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((exp) => {
                  const cfg = statusConfig[exp.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50 transition group">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 text-sm">{exp.vendorName}</div>
                        {exp.vendorEmail && <div className="text-xs text-gray-400">{exp.vendorEmail}</div>}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 font-mono">{exp.invoiceNumber || "—"}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{exp.category || "—"}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{exp.dueDate || "—"}</td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(exp.total, exp.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative flex justify-end">
                          <button
                            onClick={() => setMenuOpen(menuOpen === exp.id ? null : exp.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {menuOpen === exp.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg w-44 overflow-hidden">
                                {(["pending","paid","overdue"] as const).filter((s) => s !== exp.status).map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => { statusMut.mutate({ id: exp.id, status: s }); setMenuOpen(null); }}
                                    className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Circle className="w-2 h-2" />
                                    Mark as {s}
                                  </button>
                                ))}
                                <div className="border-t border-gray-50" />
                                <button
                                  onClick={() => { deleteMut.mutate(exp.id); setMenuOpen(null); }}
                                  className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showPdfModal && (
        <PdfUploadModal
          onClose={() => setShowPdfModal(false)}
          onSaved={() => {
            setShowPdfModal(false);
            qc.invalidateQueries({ queryKey: ["expenses"] });
          }}
        />
      )}
    </AppLayout>
  );
}
