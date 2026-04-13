import { useState, useRef, useCallback } from "react";
import { CURRENCIES } from "@/lib/currencies";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["Software", "Office", "Marketing", "Travel", "Consulting", "Other"];

async function parsePdf(file: File) {
  const form = new FormData();
  form.append("pdf", file);
  const res = await fetch("/api/expenses/parse-pdf", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) throw new Error("Failed to parse PDF");
  return res.json() as Promise<{
    vendorName: string;
    invoiceNumber: string;
    total: string;
    issueDate: string;
    pdfData: string;
  }>;
}

async function saveExpense(data: Record<string, any>) {
  const res = await fetch("/api/expenses", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to save expense");
  }
  return res.json();
}

export function PdfUploadModal({ onClose, onSaved }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  // Extracted / editable fields
  const [vendorName, setVendorName]       = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [total, setTotal]                 = useState("");
  const [issueDate, setIssueDate]         = useState("");
  const [currency, setCurrency]           = useState("USD");
  const [category, setCategory]           = useState("");
  const [notes, setNotes]                 = useState("");

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Only PDF files are accepted.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10 MB.", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setUploading(true);
    try {
      const result = await parsePdf(file);
      setPdfData(result.pdfData);
      setVendorName(result.vendorName || "");
      setInvoiceNumber(result.invoiceNumber || "");
      setTotal(result.total || "");
      setIssueDate(result.issueDate || new Date().toISOString().split("T")[0]);
    } catch {
      toast({ title: "Parse error", description: "Could not extract data from the PDF.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  async function handleSave() {
    if (!vendorName.trim()) {
      toast({ title: "Error", description: "Vendor name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await saveExpense({
        vendorName, invoiceNumber: invoiceNumber || undefined,
        total: total || "0", issueDate: issueDate || new Date().toISOString().split("T")[0],
        currency, category: category || undefined, notes: notes || undefined,
        pdfData: pdfData || undefined, subtotal: total || "0", taxAmount: "0",
      });
      toast({ title: "Saved", description: "Expense saved successfully." });
      onSaved();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white`;
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Upload Invoice PDF</h2>
            <p className="text-xs text-gray-400 mt-0.5">We'll try to extract the key data automatically</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Drop zone */}
          {!pdfData && !uploading && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition
                ${dragging ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-gray-50"}`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Drop your PDF here</p>
                <p className="text-xs text-gray-400 mt-0.5">or click to browse · max 10 MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          {uploading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              <p className="text-sm text-gray-500">Parsing PDF…</p>
            </div>
          )}

          {pdfData && !uploading && (
            <>
              {/* Uploaded file */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-green-800 truncate">{fileName}</span>
                <button
                  onClick={() => { setPdfData(null); setFileName(""); setVendorName(""); setInvoiceNumber(""); setTotal(""); setIssueDate(""); }}
                  className="ml-auto p-1 text-green-600 hover:text-red-500 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Editable extracted fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Vendor Name *</label>
                  <input className={inputCls} value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Acme Corp" />
                </div>
                <div>
                  <label className={labelCls}>Invoice Number</label>
                  <input className={inputCls} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-001" />
                </div>
                <div>
                  <label className={labelCls}>Total Amount</label>
                  <input className={`${inputCls} text-right`} type="number" min={0} step={0.01}
                    value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Issue Date</label>
                  <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          {pdfData && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="py-2 px-4 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Expense
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
