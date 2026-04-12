import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { useInvoice, useUpdateInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser, type AuthUser } from "@/lib/auth";
import type { InvoiceStatus, InvoiceDetail } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowLeft,
  Circle,
  CheckCircle,
  Send,
  Clock,
  FileEdit,
  Trash2,
  Download,
  Mail,
  MoreHorizontal,
  Loader2,
  X,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatEuro(amount: string | number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(str: string | null | undefined) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<InvoiceStatus, { badge: string; icon: React.ElementType }> = {
  paid:    { badge: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  sent:    { badge: "bg-blue-50 text-blue-700 border-blue-200",   icon: Send },
  overdue: { badge: "bg-red-50 text-red-700 border-red-200",       icon: Clock },
  draft:   { badge: "bg-gray-50 text-gray-600 border-gray-200",   icon: FileEdit },
};

const statusOptions: InvoiceStatus[] = ["draft", "sent", "paid", "overdue"];

// ── PDF generator ─────────────────────────────────────────────────────────────
function generatePdf(invoice: InvoiceDetail, user: AuthUser | null | undefined): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const ml = 15;
  const mr = pageW - 15;

  // ── Logo / bedrijfsnaam ──
  let headerBottomY = 30;
  if (user?.logoUrl && user.logoUrl.startsWith("data:image/")) {
    try {
      const fmt = user.logoUrl.includes("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(user.logoUrl, fmt, ml, 12, 45, 16);
      headerBottomY = 32;
    } catch {
      doc.setFontSize(18).setTextColor(22, 163, 74).setFont("helvetica", "bold");
      doc.text(user?.companyName || "Jouw Bedrijf", ml, 22);
    }
  } else {
    doc.setFontSize(18).setTextColor(22, 163, 74).setFont("helvetica", "bold");
    doc.text(user?.companyName || "Jouw Bedrijf", ml, 22);
  }

  doc.setFontSize(8).setTextColor(120, 120, 120).setFont("helvetica", "normal");
  let yComp = headerBottomY;
  if (user?.companyAddress) { doc.text(user.companyAddress, ml, yComp); yComp += 4.5; }
  if (user?.companyCity)    { doc.text(user.companyCity,    ml, yComp); yComp += 4.5; }
  if (user?.companyKvk)     { doc.text(`KvK: ${user.companyKvk}`, ml, yComp); yComp += 4.5; }
  if (user?.companyBtw)     { doc.text(`BTW: ${user.companyBtw}`, ml, yComp); yComp += 4.5; }
  if (user?.companyIban)    { doc.text(`IBAN: ${user.companyIban}`, ml, yComp); yComp += 4.5; }

  doc.setFontSize(26).setTextColor(30, 30, 30).setFont("helvetica", "bold");
  doc.text("FACTUUR", mr, 22, { align: "right" });
  doc.setFontSize(10).setTextColor(120, 120, 120).setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, mr, 29, { align: "right" });

  const sepY = Math.max(yComp + 4, 50);
  doc.setDrawColor(230, 230, 230).setLineWidth(0.3);
  doc.line(ml, sepY, mr, sepY);

  const clientY = sepY + 8;
  doc.setFontSize(7.5).setTextColor(160, 160, 160).setFont("helvetica", "bold");
  doc.text("FACTUUR AAN", ml, clientY);

  const clientName = invoice.client?.name || invoice.clientName || "Onbekende klant";
  doc.setFontSize(11).setTextColor(30, 30, 30).setFont("helvetica", "bold");
  doc.text(clientName, ml, clientY + 6);

  doc.setFontSize(9).setTextColor(100, 100, 100).setFont("helvetica", "normal");
  let yC = clientY + 12;
  if (invoice.client?.address) { doc.text(invoice.client.address, ml, yC); yC += 5; }
  if (invoice.client?.city)    { doc.text(invoice.client.city,    ml, yC); yC += 5; }
  if (invoice.client?.email)   { doc.text(invoice.client.email,   ml, yC); yC += 5; }

  const col2 = 120;
  doc.setFontSize(9).setTextColor(120, 120, 120).setFont("helvetica", "normal");
  doc.text("Factuurdatum", col2, clientY + 6);
  doc.text("Vervaldatum",  col2, clientY + 13);
  doc.setTextColor(30, 30, 30).setFont("helvetica", "bold");
  doc.text(formatDate(invoice.issueDate), mr, clientY + 6,  { align: "right" });
  doc.text(formatDate(invoice.dueDate),   mr, clientY + 13, { align: "right" });

  const tableStartY = Math.max(yC + 8, clientY + 26);

  autoTable(doc, {
    startY: tableStartY,
    head: [["Omschrijving", "Aantal", "Stukprijs", "Bedrag"]],
    body: invoice.items.map((item) => [
      item.description,
      Number(item.quantity).toString(),
      formatEuro(item.unitPrice),
      formatEuro(item.amount),
    ]),
    styles: { fontSize: 9.5, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 } },
    headStyles: {
      fillColor: [248, 249, 250],
      textColor: [120, 120, 120],
      fontStyle: "bold",
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 22 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "right", cellWidth: 35 },
    },
    alternateRowStyles: { fillColor: [253, 253, 253] },
    theme: "grid",
    margin: { left: ml, right: 15 },
  });

  const finalY: number = (doc as any).lastAutoTable.finalY + 6;

  const totW = 70;
  const totX = mr - totW;

  doc.setFontSize(9).setFont("helvetica", "normal");

  function totRow(label: string, value: string, bold = false, color: [number,number,number] = [60,60,60]) {
    const y = (doc as any)._totY;
    doc.setTextColor(...color).setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, totX, y);
    doc.text(value, mr, y, { align: "right" });
    (doc as any)._totY += 6;
  }

  (doc as any)._totY = finalY;
  totRow("Subtotaal", formatEuro(invoice.subtotal));
  if (Number(invoice.discount) > 0) {
    totRow("Korting", `-${formatEuro(invoice.discount)}`, false, [200, 50, 50]);
  }
  totRow(`BTW ${Number(invoice.taxRate)}%`, formatEuro(invoice.taxAmount));

  const lineY: number = (doc as any)._totY - 2;
  doc.setDrawColor(200, 200, 200).setLineWidth(0.3);
  doc.line(totX, lineY, mr, lineY);
  (doc as any)._totY += 2;

  totRow("Totaal te betalen", formatEuro(invoice.total), true, [22, 163, 74]);

  let footerY: number = (doc as any)._totY + 10;

  if (user?.companyIban) {
    doc.setDrawColor(230, 230, 230).setLineWidth(0.3);
    doc.line(ml, footerY, mr, footerY);
    footerY += 5;
    doc.setFontSize(8).setTextColor(100, 100, 100).setFont("helvetica", "normal");
    doc.text(
      `Gelieve te betalen op ${user.companyIban} o.v.v. factuurnummer ${invoice.invoiceNumber}.`,
      ml, footerY
    );
    footerY += 8;
  }

  if (invoice.notes) {
    doc.setFontSize(8).setTextColor(100, 100, 100).setFont("helvetica", "bold");
    doc.text("Opmerkingen:", ml, footerY);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.notes, ml, footerY + 5);
  }

  return doc;
}

// ── Invoice Print (schermweergave) ────────────────────────────────────────────
function InvoicePrint({
  invoiceNumber, issueDate, dueDate, clientName, clientEmail, clientAddress, clientCity,
  notes, taxRate, taxAmount, subtotal, total, discount, items,
  companyName, companyAddress, companyCity, companyKvk, companyBtw, companyIban, logoUrl,
}: {
  invoiceNumber: string; issueDate: string; dueDate: string;
  clientName: string; clientEmail?: string | null; clientAddress?: string | null; clientCity?: string | null;
  notes?: string | null; taxRate: string; taxAmount: string; subtotal: string; total: string; discount: string;
  items: { description: string; quantity: string; unitPrice: string; amount: string }[];
  companyName?: string | null; companyAddress?: string | null; companyCity?: string | null;
  companyKvk?: string | null; companyBtw?: string | null; companyIban?: string | null; logoUrl?: string | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 font-sans text-gray-800 text-sm leading-relaxed">
      <div className="flex justify-between items-start mb-10">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 object-contain mb-1" />
          ) : (
            <div className="text-2xl font-bold text-green-600 mb-1">{companyName || t("newInvoice.yourCompany")}</div>
          )}
          {companyAddress && <div className="text-xs text-gray-500">{companyAddress}</div>}
          {companyCity    && <div className="text-xs text-gray-500">{companyCity}</div>}
          {companyKvk     && <div className="text-xs text-gray-500 mt-1">KvK: {companyKvk}</div>}
          {companyBtw     && <div className="text-xs text-gray-500">BTW: {companyBtw}</div>}
          {companyIban    && <div className="text-xs text-gray-500">IBAN: {companyIban}</div>}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 tracking-tight">FACTUUR</div>
          <div className="text-sm text-gray-500 mt-1 font-mono">{invoiceNumber}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{t("invoiceDetail.factuurAan")}</div>
          <div className="font-semibold text-base">{clientName}</div>
          {clientAddress && <div className="text-sm text-gray-500 mt-0.5">{clientAddress}</div>}
          {clientCity    && <div className="text-sm text-gray-500">{clientCity}</div>}
          {clientEmail   && <div className="text-sm text-gray-500">{clientEmail}</div>}
        </div>
        <div className="text-right space-y-1.5">
          <div className="flex justify-end gap-8 text-sm">
            <span className="text-gray-500">{t("invoiceDetail.factuurdatum")}</span>
            <span className="font-medium">{formatDate(issueDate)}</span>
          </div>
          <div className="flex justify-end gap-8 text-sm">
            <span className="text-gray-500">{t("invoiceDetail.vervaldatum")}</span>
            <span className="font-medium">{formatDate(dueDate)}</span>
          </div>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-widest">
            <th className="text-left py-3 px-4 rounded-l-xl font-semibold">{t("invoiceDetail.table.description")}</th>
            <th className="text-right py-3 px-3 font-semibold">{t("invoiceDetail.table.quantity")}</th>
            <th className="text-right py-3 px-3 font-semibold">{t("invoiceDetail.table.unitPrice")}</th>
            <th className="text-right py-3 px-4 rounded-r-xl font-semibold">{t("invoiceDetail.table.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-3 px-4 text-sm">{item.description}</td>
              <td className="py-3 px-3 text-sm text-right text-gray-600">{Number(item.quantity)}</td>
              <td className="py-3 px-3 text-sm text-right text-gray-600">{formatEuro(item.unitPrice)}</td>
              <td className="py-3 px-4 text-sm text-right font-medium">{formatEuro(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-56 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{t("invoiceDetail.totals.subtotal")}</span>
            <span>{formatEuro(subtotal)}</span>
          </div>
          {Number(discount) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>{t("invoiceDetail.totals.discount")}</span>
              <span>-{formatEuro(discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">{t("invoiceDetail.totals.tax", { rate: Number(taxRate) })}</span>
            <span>{formatEuro(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-1">
            <span>{t("invoiceDetail.totals.total")}</span>
            <span className="text-green-700">{formatEuro(total)}</span>
          </div>
        </div>
      </div>

      {companyIban && (
        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{t("invoiceDetail.paidInfo")}: </span>
          {t("invoiceDetail.paidInfoText", { iban: companyIban, number: invoiceNumber })}
        </div>
      )}
      {notes && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{t("invoiceDetail.notes")}: </span>
          {notes}
        </div>
      )}
    </div>
  );
}

// ── Invoice detail page ───────────────────────────────────────────────────────
export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const invoiceId = Number(params.id);

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const { toast } = useToast();

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [sendModal, setSendModal]     = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSending, setIsSending]     = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-3">
          <p className="text-gray-500">{t("invoiceDetail.notFound")}</p>
          <button onClick={() => navigate("/invoices")} className="text-sm text-green-600 hover:underline">
            {t("invoiceDetail.notFoundBack")}
          </button>
        </div>
      </AppLayout>
    );
  }

  const statusCfg = statusConfig[invoice.status] ?? statusConfig.draft;
  const StatusIcon = statusCfg.icon;
  const statusLabel = t(`invoices.status.${invoice.status}`);

  async function handleDelete() {
    if (!confirm(t("invoiceDetail.deleteConfirm"))) return;
    await deleteInvoice.mutateAsync(invoice!.id);
    navigate("/invoices");
  }

  function handleDownloadPdf() {
    const doc = generatePdf(invoice!, user);
    doc.save(`factuur-${invoice!.invoiceNumber}.pdf`);
  }

  async function handleSendEmail() {
    if (!recipientEmail.trim()) {
      toast({ title: t("common.error"), description: t("invoiceDetail.sendModal.errorRecipient"), variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      const doc = generatePdf(invoice!, user);
      const base64 = doc.output("datauristring").split(",")[1];

      const res = await fetch("/api/send-invoice", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          pdfBase64: base64,
          invoiceNumber: invoice!.invoiceNumber,
          fromName: user?.companyName || "FactuurFlow",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? t("common.error"));

      toast({
        title: t("invoiceDetail.sendModal.sentSuccess"),
        description: t("invoiceDetail.sendModal.sentDesc", { email: recipientEmail }),
      });
      setSendModal(false);
      setRecipientEmail("");

      if (invoice!.status === "draft") {
        await updateStatus.mutateAsync({ id: invoice!.id, status: "sent" });
      }
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Terug + acties */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/invoices")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("invoiceDetail.back")}
          </button>

          <div className="flex items-center gap-2">
            {/* Status wijzigen */}
            <div className="relative">
              <button
                onClick={() => setStatusMenuOpen((o) => !o)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border rounded-xl transition ${statusCfg.badge}`}
              >
                <Circle className="w-1.5 h-1.5 fill-current" />
                {statusLabel}
                <MoreHorizontal className="w-3.5 h-3.5 ml-1" />
              </button>
              {statusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-20 bg-white border border-gray-100 rounded-xl shadow-lg w-44 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-50">
                      {t("invoiceDetail.statusMenu")}
                    </div>
                    {statusOptions.map((s) => {
                      const cfg = statusConfig[s];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={s}
                          disabled={s === invoice.status || updateStatus.isPending}
                          onClick={async () => {
                            await updateStatus.mutateAsync({ id: invoice.id, status: s });
                            setStatusMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition
                            ${s === invoice.status ? "opacity-40 cursor-default" : "hover:bg-gray-50"} text-gray-700`}
                        >
                          <Icon className="w-3.5 h-3.5 text-gray-400" />
                          {t(`invoices.status.${s}`)}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => {
                setRecipientEmail(invoice.clientEmail ?? invoice.client?.email ?? "");
                setSendModal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <Mail className="w-4 h-4" />
              {t("invoiceDetail.send")}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              {t("invoiceDetail.pdf")}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteInvoice.isPending}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Factuurkop info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{invoice.invoiceNumber}</h1>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.badge}`}>
                <StatusIcon className="w-3 h-3" />
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {invoice.clientName ?? t("invoiceDetail.noClient")} · {t("invoiceDetail.createdOn", { date: formatDate(invoice.createdAt) })}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-gray-900">{formatEuro(invoice.total)}</div>
            <div className="text-xs text-gray-400 mt-0.5">{t("invoiceDetail.inclBtw")}</div>
          </div>
        </div>

        {/* Factuur document */}
        <InvoicePrint
          invoiceNumber={invoice.invoiceNumber}
          issueDate={invoice.issueDate}
          dueDate={invoice.dueDate}
          clientName={invoice.client?.name ?? invoice.clientName ?? "Onbekende klant"}
          clientEmail={invoice.client?.email}
          clientAddress={invoice.client?.address}
          clientCity={invoice.client?.city}
          notes={invoice.notes}
          taxRate={invoice.taxRate}
          taxAmount={invoice.taxAmount}
          subtotal={invoice.subtotal}
          total={invoice.total}
          discount={invoice.discount}
          items={invoice.items}
          companyName={user?.companyName}
          companyAddress={user?.companyAddress}
          companyCity={user?.companyCity}
          companyKvk={user?.companyKvk}
          companyBtw={user?.companyBtw}
          companyIban={user?.companyIban}
          logoUrl={user?.logoUrl}
        />
      </div>

      {/* ── E-mail modal ── */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSendModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{t("invoiceDetail.sendModal.title")}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("invoiceDetail.sendModal.subtitle", { number: invoice.invoiceNumber })}
                </p>
              </div>
              <button
                onClick={() => setSendModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("invoiceDetail.sendModal.recipient")}
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
                  placeholder="klant@bedrijf.nl"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                {t("invoiceDetail.sendModal.info")}
              </div>
            </div>

            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setSendModal(false)}
                className="py-2.5 px-4 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDownloadPdf}
                className="py-2.5 px-4 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                {t("invoiceDetail.sendModal.pdfOnly")}
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="py-2.5 px-4 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-60 flex items-center gap-2"
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isSending ? t("common.sending") : t("common.send")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
