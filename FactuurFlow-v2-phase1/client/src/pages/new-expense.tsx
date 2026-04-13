import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { CURRENCIES, formatCurrency } from "@/lib/currencies";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CATEGORIES = ["Software", "Office", "Marketing", "Travel", "Consulting", "Other"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

async function createExpense(data: Record<string, any>) {
  const res = await fetch("/api/expenses", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to create expense");
  }
  return res.json();
}

export default function NewExpensePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [vendorName, setVendorName]       = useState("");
  const [vendorEmail, setVendorEmail]     = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate]         = useState(todayStr());
  const [dueDate, setDueDate]             = useState("");
  const [currency, setCurrency]           = useState("USD");
  const [subtotal, setSubtotal]           = useState("");
  const [taxAmount, setTaxAmount]         = useState("");
  const [total, setTotal]                 = useState("");
  const [category, setCategory]           = useState("");
  const [notes, setNotes]                 = useState("");

  const mut = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      navigate("/expenses");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorName.trim()) {
      toast({ title: "Error", description: "Vendor name is required.", variant: "destructive" });
      return;
    }
    mut.mutate({ vendorName, vendorEmail, invoiceNumber, issueDate, dueDate: dueDate || undefined,
      currency, subtotal: subtotal || "0", taxAmount: taxAmount || "0", total: total || "0",
      category: category || undefined, notes: notes || undefined });
  }

  const inputCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white`;
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  const sub = Number(subtotal) || 0;
  const tax = Number(taxAmount) || 0;
  const tot = Number(total) || (sub + tax);

  return (
    <AppLayout>
      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add Expense</h1>
            <p className="text-xs text-gray-500 mt-0.5">Record an incoming bill or invoice</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/expenses")}
              className="py-2 px-4 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={mut.isPending}
              className="py-2 px-4 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {mut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Expense
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Form */}
          <div className="flex-1 space-y-4">
            {/* Vendor */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Vendor Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Vendor Name *</label>
                  <input className={inputCls} value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Acme Corp" />
                </div>
                <div>
                  <label className={labelCls}>Vendor Email</label>
                  <input className={inputCls} type="email" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} placeholder="billing@vendor.com" />
                </div>
                <div>
                  <label className={labelCls}>Invoice Number</label>
                  <input className={inputCls} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-001" />
                </div>
              </div>
            </div>

            {/* Dates & Category */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Issue Date *</label>
                  <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Amounts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Amounts</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Subtotal</label>
                  <input className={`${inputCls} text-right`} type="number" min={0} step={0.01}
                    value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Tax Amount</label>
                  <input className={`${inputCls} text-right`} type="number" min={0} step={0.01}
                    value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Total</label>
                  <input className={`${inputCls} text-right font-semibold`} type="number" min={0} step={0.01}
                    value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Notes</h2>
              <textarea className={`${inputCls} resize-none`} rows={3}
                value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes…" />
            </div>
          </div>

          {/* Preview */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Preview</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Vendor</p>
                  <p className="font-semibold text-gray-900">{vendorName || "—"}</p>
                  {vendorEmail && <p className="text-xs text-gray-400">{vendorEmail}</p>}
                </div>
                {invoiceNumber && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Invoice #</p>
                    <p className="font-mono text-gray-700">{invoiceNumber}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Issue Date</p>
                    <p className="text-gray-700">{issueDate || "—"}</p>
                  </div>
                  {dueDate && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Due Date</p>
                      <p className="text-gray-700">{dueDate}</p>
                    </div>
                  )}
                </div>
                {category && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Category</p>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{category}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 space-y-1">
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Subtotal</span>
                    <span>{formatCurrency(sub, currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Tax</span>
                    <span>{formatCurrency(tax, currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1 mt-1">
                    <span>Total</span>
                    <span className="text-red-600">{formatCurrency(tot, currency)}</span>
                  </div>
                </div>
                {notes && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-xs text-gray-600">{notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
