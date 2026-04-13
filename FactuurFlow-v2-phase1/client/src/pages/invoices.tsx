import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { useInvoices, useDeleteInvoice, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import type { Invoice, InvoiceStatus } from "@/lib/api";
import { formatCurrency } from "@/lib/currencies";
import {
  Search,
  Plus,
  MoreHorizontal,
  Circle,
  ChevronUp,
  ChevronDown,
  Loader2,
  Trash2,
  CheckCircle,
  Send,
  Clock,
  FileEdit,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<InvoiceStatus, { classes: string; icon: React.ElementType }> = {
  paid:    { classes: "bg-green-50 text-green-700", icon: CheckCircle },
  sent:    { classes: "bg-blue-50 text-blue-700",   icon: Send },
  overdue: { classes: "bg-red-50 text-red-700",     icon: Clock },
  draft:   { classes: "bg-gray-100 text-gray-600",  icon: FileEdit },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}>
      <Circle className="w-1.5 h-1.5 fill-current" />
      {t(`invoices.status.${status}`)}
    </span>
  );
}

// ── Status options ────────────────────────────────────────────────────────────
const statusOptions: InvoiceStatus[] = ["draft", "sent", "paid", "overdue"];

function StatusMenu({
  invoiceId,
  current,
  onClose,
}: {
  invoiceId: number;
  current: InvoiceStatus;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const updateStatus = useUpdateInvoiceStatus();
  return (
    <div className="absolute right-8 top-8 z-30 bg-white border border-gray-100 rounded-xl shadow-lg w-40 overflow-hidden">
      {statusOptions.map((s) => {
        const cfg = statusConfig[s];
        const Icon = cfg.icon;
        return (
          <button
            key={s}
            onClick={async (e) => {
              e.stopPropagation();
              await updateStatus.mutateAsync({ id: invoiceId, status: s });
              onClose();
            }}
            disabled={s === current || updateStatus.isPending}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition
              ${s === current ? "opacity-40 cursor-default" : "hover:bg-gray-50"}
              text-gray-700`}
          >
            <Icon className="w-3.5 h-3.5 text-gray-400" />
            {t(`invoices.status.${s}`)}
          </button>
        );
      })}
    </div>
  );
}

// ── Filter tabs (computed inside component via t()) ───────────────────────────
const TAB_KEYS = ["all", "sent", "paid", "overdue", "draft"] as const;

type SortKey = "invoiceNumber" | "clientName" | "issueDate" | "dueDate" | "total" | "status";
type SortDir = "asc" | "desc";

// ── Invoices page ─────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { data: invoices = [], isLoading } = useInvoices();

  const tabs = [
    { key: "all",     label: t("invoices.tabs.all") },
    { key: "sent",    label: t("invoices.tabs.open") },
    { key: "paid",    label: t("invoices.tabs.paid") },
    { key: "overdue", label: t("invoices.tabs.overdue") },
    { key: "draft",   label: t("invoices.tabs.draft") },
  ];
  const deleteInvoice = useDeleteInvoice();
  const updateStatus = useUpdateInvoiceStatus();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("issueDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = invoices
    .filter((inv) => activeTab === "all" || inv.status === activeTab)
    .filter((inv) =>
      search === "" ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.clientName ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "total") cmp = Number(a.total) - Number(b.total);
      else {
        const av = (a as any)[sortKey] ?? "";
        const bv = (b as any)[sortKey] ?? "";
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3.5 h-3.5 text-gray-300" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 text-green-600" />
      : <ChevronDown className="w-3.5 h-3.5 text-green-600" />;
  }

  const counts: Record<string, number> = { all: invoices.length };
  invoices.forEach((inv) => { counts[inv.status] = (counts[inv.status] ?? 0) + 1; });

  const columns: { key: SortKey; label: string }[] = [
    { key: "invoiceNumber", label: t("invoices.cols.number") },
    { key: "clientName",    label: t("invoices.cols.client") },
    { key: "issueDate",     label: t("invoices.cols.date") },
    { key: "dueDate",       label: t("invoices.cols.dueDate") },
    { key: "total",         label: t("invoices.cols.amount") },
    { key: "status",        label: t("invoices.cols.status") },
  ];

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("invoices.title")}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{t("invoices.count", { count: invoices.length })}</p>
          </div>
          <button
            onClick={() => navigate("/invoices/new")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white
                       text-sm font-medium py-2.5 px-4 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            {t("invoices.new")}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100">
          {/* Tabs + zoek */}
          <div className="flex items-center justify-between px-4 pt-4 pb-0 border-b border-gray-100 gap-4 flex-wrap">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition -mb-px
                    ${activeTab === tab.key
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {tab.label}
                  {counts[tab.key] !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                      ${activeTab === tab.key ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {counts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("invoices.search")}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-56
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tabel */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {columns.map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => toggleSort(key)}
                        className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 cursor-pointer
                                   hover:text-gray-700 select-none whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          <SortIcon col={key} />
                        </span>
                      </th>
                    ))}
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                        {invoices.length === 0
                          ? t("invoices.empty")
                          : t("invoices.emptyFiltered")}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 transition cursor-pointer relative"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        <td className="px-5 py-4 text-sm font-medium text-gray-900 font-mono">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">
                          {inv.clientName ?? <span className="text-gray-400 italic">{t("invoices.noClient")}</span>}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{inv.issueDate}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{inv.dueDate}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(inv.total, inv.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-5 py-4 relative">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(openMenu === inv.id ? null : inv.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openMenu === inv.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }}
                                />
                                <div className="absolute right-0 top-8 z-30 bg-white border border-gray-100 rounded-xl shadow-lg w-44 overflow-hidden">
                                  <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-50">
                                    {t("invoices.changeStatus")}
                                  </div>
                                  {statusOptions.map((s) => {
                                    const cfg = statusConfig[s];
                                    const Icon = cfg.icon;
                                    return (
                                      <button
                                        key={s}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (s !== inv.status) {
                                            await updateStatus.mutateAsync({ id: inv.id, status: s });
                                          }
                                          setOpenMenu(null);
                                        }}
                                        disabled={s === inv.status}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition
                                          ${s === inv.status ? "opacity-40 cursor-default" : "hover:bg-gray-50"}
                                          text-gray-700`}
                                      >
                                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                                        {t(`invoices.status.${s}`)}
                                      </button>
                                    );
                                  })}
                                  <div className="border-t border-gray-50">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await deleteInvoice.mutateAsync(inv.id);
                                        setOpenMenu(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      {t("common.delete")}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
