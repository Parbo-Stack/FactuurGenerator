import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { useClients } from "@/hooks/useClients";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchCurrentUser } from "@/lib/auth";
import { formatCurrency, CURRENCIES } from "@/lib/currency";
import { Plus, Trash2, ChevronDown, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(str: string) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

let nextId = 2;

// ── Invoice Preview ───────────────────────────────────────────────────────────
function InvoicePreview({
  invoiceNumber,
  issueDate,
  dueDate,
  clientName,
  clientEmail,
  clientAddress,
  clientCity,
  notes,
  taxRate,
  currency,
  items,
  companyName,
  logoUrl,
}: {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientCity: string;
  notes: string;
  taxRate: number;
  currency: string;
  items: LineItem[];
  companyName?: string | null;
  logoUrl?: string | null;
}) {
  const { t } = useTranslation();
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-medium text-gray-500">{t("newInvoice.livePreview")}</span>
        <span className="text-xs text-gray-400">{invoiceNumber}</span>
      </div>
      <div className="p-6 font-sans text-gray-800 text-sm leading-relaxed overflow-y-auto flex-1">
        <div className="flex justify-between items-start mb-8">
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
            ) : (
              <div className="text-xl font-bold text-green-600 mb-1">
                {companyName || t("newInvoice.yourCompany")}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">FACTUUR</div>
            <div className="text-xs text-gray-500 mt-1">{invoiceNumber || "FF-2024-XXX"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              {t("invoiceDetail.factuurAan")}
            </div>
            <div className="font-semibold">{clientName || t("newInvoice.clientPlaceholder")}</div>
            {clientAddress && <div className="text-xs text-gray-500">{clientAddress}</div>}
            {clientCity && <div className="text-xs text-gray-500">{clientCity}</div>}
            {clientEmail && <div className="text-xs text-gray-500">{clientEmail}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">{t("invoiceDetail.factuurdatum")}:</span>{" "}
              {formatDate(issueDate)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium text-gray-700">{t("invoiceDetail.vervaldatum")}:</span>{" "}
              {formatDate(dueDate)}
            </div>
          </div>
        </div>

        <table className="w-full text-xs mb-6">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
              <th className="text-left py-2 px-3 rounded-l-lg font-medium">{t("invoiceDetail.table.description")}</th>
              <th className="text-right py-2 px-2 font-medium">{t("invoiceDetail.table.quantity")}</th>
              <th className="text-right py-2 px-2 font-medium">{t("invoiceDetail.table.unitPrice")}</th>
              <th className="text-right py-2 px-3 rounded-r-lg font-medium">{t("invoiceDetail.table.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-2 px-3">
                  {item.description || <span className="text-gray-300">{t("newInvoice.descriptionPlaceholder")}</span>}
                </td>
                <td className="py-2 px-2 text-right">{item.quantity}</td>
                <td className="py-2 px-2 text-right">{fmt(item.unitPrice)}</td>
                <td className="py-2 px-3 text-right font-medium">
                  {fmt(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-48 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">{t("newInvoice.subtotal")}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("newInvoice.tax", { rate: taxRate })}</span>
            <span>{fmt(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-gray-200 pt-1">
            <span>{t("newInvoice.total")}</span>
            <span className="text-green-700">{fmt(total)}</span>
          </div>
        </div>

        {notes && (
          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <div className="font-medium text-gray-700 mb-1">{t("newInvoice.sections.notes")}</div>
            {notes}
          </div>
        )}
      </div>
    </div>
  );
}

// ── New Invoice Page ───────────────────────────────────────────────────────────
export default function NewInvoicePage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { data: clients = [] } = useClients();
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
  const createInvoice = useCreateInvoice();
  const { toast } = useToast();

  const [invoiceNumber, setInvoiceNumber] = useState(
    `${user?.invoicePrefix ?? "FF"}-${new Date().getFullYear()}-001`
  );
  const [issueDate, setIssueDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState(addDays(todayStr(), Number(user?.defaultPaymentDays ?? 30)));
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(Number(user?.defaultTaxRate ?? 21));
  const [currency, setCurrency] = useState(user?.defaultCurrency ?? "EUR");
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<"draft" | "sent" | null>(null);
  const [priceMode, setPriceMode] = useState<"excl" | "incl">("excl");

  function toExcl(price: number) {
    return priceMode === "incl" ? price / (1 + taxRate / 100) : price;
  }

  function selectClient(client: (typeof clients)[0]) {
    setSelectedClientId(client.id);
    setClientName(client.name);
    setClientEmail(client.email ?? "");
    setClientAddress(client.address ?? "");
    setClientCity(client.city ?? "");
    setClientDropdownOpen(false);
  }

  function updateItem(id: number, key: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [key]: key === "description" ? value : Number(value) }
          : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { id: nextId++, description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSave(status: "draft" | "sent") {
    if (!invoiceNumber.trim()) {
      toast({ title: t("common.error"), description: t("newInvoice.validationNumber"), variant: "destructive" });
      return;
    }
    const emptyItem = items.find((i) => !i.description.trim());
    if (emptyItem) {
      toast({ title: t("common.error"), description: t("newInvoice.validationLines"), variant: "destructive" });
      return;
    }

    setSaveMode(status);
    try {
      await createInvoice.mutateAsync({
        clientId: selectedClientId,
        invoiceNumber,
        status,
        issueDate,
        dueDate,
        notes: notes || undefined,
        currency,
        taxRate,
        items: items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: toExcl(item.unitPrice),
          sortOrder: idx,
        })),
      });
      navigate("/invoices");
    } catch {
      // Error al getoond via onError toast in useCreateInvoice
    } finally {
      setSaveMode(null);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * toExcl(i.unitPrice), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const previewItems = items.map((i) => ({ ...i, unitPrice: toExcl(i.unitPrice) }));

  const inputCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white`;
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <AppLayout>
      <div className="p-6 h-screen flex flex-col max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("newInvoice.title")}</h1>
            <p className="text-gray-500 text-xs mt-0.5">{invoiceNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/invoices")}
              className="py-2 px-4 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => handleSave("draft")}
              disabled={createInvoice.isPending}
              className="py-2 px-4 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {saveMode === "draft" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("newInvoice.saveDraft")}
            </button>
            <button
              onClick={() => handleSave("sent")}
              disabled={createInvoice.isPending}
              className="py-2 px-4 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {saveMode === "sent" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("newInvoice.send")}
            </button>
          </div>
        </div>

        {/* Twee kolommen */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Formulier */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Factuurinfo */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">{t("newInvoice.sections.invoiceData")}</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>{t("newInvoice.fields.number")}</label>
                  <input className={inputCls} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>{t("newInvoice.fields.issueDate")}</label>
                  <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>{t("newInvoice.fields.dueDate")}</label>
                  <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Klant */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">{t("newInvoice.sections.client")}</h2>

              <div className="relative mb-4">
                <label className={labelCls}>{t("newInvoice.fields.selectClient")}</label>
                <button
                  type="button"
                  onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200
                             rounded-lg hover:bg-gray-50 transition text-left"
                >
                  <span className={clientName ? "text-gray-700" : "text-gray-400"}>
                    {clientName || (clients.length === 0 ? t("newInvoice.fields.noClients") : t("newInvoice.fields.selectClient"))}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {clientDropdownOpen && clients.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectClient(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{c.name}</div>
                          {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t("newInvoice.fields.clientName")}</label>
                  <input className={inputCls} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Bedrijfsnaam" />
                </div>
                <div>
                  <label className={labelCls}>{t("newInvoice.fields.clientEmail")}</label>
                  <input className={inputCls} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="info@bedrijf.nl" />
                </div>
                <div>
                  <label className={labelCls}>{t("newInvoice.fields.clientAddress")}</label>
                  <input className={inputCls} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Straat en huisnummer" />
                </div>
                <div>
                  <label className={labelCls}>{t("newInvoice.fields.clientCity")}</label>
                  <input className={inputCls} value={clientCity} onChange={(e) => setClientCity(e.target.value)} placeholder="Amsterdam" />
                </div>
              </div>
            </div>

            {/* Regels */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">{t("newInvoice.sections.lines")}</h2>
              <div className="grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 mb-2 px-1">
                <span className="text-xs text-gray-400 font-medium">{t("newInvoice.fields.description")}</span>
                <span className="text-xs text-gray-400 font-medium text-right">{t("newInvoice.fields.quantity")}</span>
                <span className="text-xs text-gray-400 font-medium text-right">
                  {priceMode === "excl" ? t("newInvoice.fields.priceExcl") : t("newInvoice.fields.priceIncl")}
                </span>
                <span className="text-xs text-gray-400 font-medium text-right">{t("newInvoice.fields.lineTotal")}</span>
                <span />
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 items-center">
                    <input
                      className={inputCls}
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Omschrijving dienst of product"
                    />
                    <input
                      className={`${inputCls} text-right`}
                      type="number"
                      min={0}
                      step={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                    />
                    <input
                      className={`${inputCls} text-right`}
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                    />
                    <div className="text-sm font-medium text-gray-700 text-right pr-1">
                      {formatCurrency(item.quantity * item.unitPrice, currency)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="p-1.5 text-gray-300 hover:text-red-500 disabled:opacity-30 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addItem}
                className="mt-3 flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition"
              >
                <Plus className="w-4 h-4" />
                {t("newInvoice.addLine")}
              </button>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-end justify-between gap-4">
                <div className="flex items-end gap-3">
                  <div>
                    <label className={labelCls}>{t("newInvoice.fields.currency")}</label>
                    <select
                      className={`${inputCls} w-36`}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t("newInvoice.fields.taxRate")}</label>
                    <select
                      className={`${inputCls} w-28`}
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                    >
                      <option value={0}>0%</option>
                      <option value={9}>9%</option>
                      <option value={21}>21%</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t("newInvoice.fields.priceMode")}</label>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setPriceMode("excl")}
                        className={`px-3 py-2 transition ${priceMode === "excl" ? "bg-green-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                      >
                        {t("newInvoice.fields.exclBtw")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceMode("incl")}
                        className={`px-3 py-2 transition border-l border-gray-200 ${priceMode === "incl" ? "bg-green-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                      >
                        {t("newInvoice.fields.inclBtw")}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1 text-sm min-w-[160px]">
                  <div className="flex justify-between gap-8 text-gray-500">
                    <span>{t("newInvoice.subtotal")}</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-gray-500">
                    <span>{t("newInvoice.tax", { rate: taxRate })}</span>
                    <span>{formatCurrency(tax, currency)}</span>
                  </div>
                  <div className="flex justify-between gap-8 font-bold text-gray-900 text-base border-t border-gray-200 pt-1">
                    <span>{t("newInvoice.total")}</span>
                    <span className="text-green-700">{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notities */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">{t("newInvoice.sections.notes")}</h2>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("newInvoice.fields.notes")}
              />
            </div>
          </div>

          {/* Live preview */}
          <div className="w-[420px] flex-shrink-0">
            <InvoicePreview
              invoiceNumber={invoiceNumber}
              issueDate={issueDate}
              dueDate={dueDate}
              clientName={clientName}
              clientEmail={clientEmail}
              clientAddress={clientAddress}
              clientCity={clientCity}
              notes={notes}
              taxRate={taxRate}
              currency={currency}
              items={previewItems}
              companyName={user?.companyName}
              logoUrl={user?.logoUrl}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
