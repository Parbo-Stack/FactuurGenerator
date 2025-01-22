import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format, addDays } from "date-fns";
import i18n from "./i18n";

export interface Product {
  description: string;
  quantity: number;
  price: number;
}

export type PaymentTerm = "14_days" | "30_days" | "net_15" | "net_60";

export const paymentTerms: Record<PaymentTerm, { label: string; days: number }> = {
  "14_days": { label: "14 dagen", days: 14 },
  "30_days": { label: "30 dagen", days: 30 },
  "net_15": { label: "Netto 15", days: 15 },
  "net_60": { label: "Netto 60", days: 60 },
};

export interface InvoiceData {
  companyName: string;
  name: string;
  address: string;
  cocNumber: string;
  vatNumber: string;
  iban: string;
  invoiceNumber: string;
  date: Date;
  paymentTerm: PaymentTerm;
  products: Product[];
  vatRate: 9 | 21;
  currency: "EUR" | "USD" | "GBP";
  notes?: string;
}

const currencySymbols = {
  EUR: "€",
  USD: "$",
  GBP: "£",
} as const;

export const calculateTotals = (products: Product[], vatRate: number) => {
  const subtotal = products.reduce((sum, product) => sum + product.price * product.quantity, 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
};

export const formatCurrency = (amount: number, currency: keyof typeof currencySymbols) => {
  return `${currencySymbols[currency]} ${amount.toFixed(2)}`;
};

export const calculateDueDate = (date: Date, paymentTerm: PaymentTerm): Date => {
  if (!date || !paymentTerm || !paymentTerms[paymentTerm]) {
    return new Date(); // Return current date as fallback
  }
  return addDays(date, paymentTerms[paymentTerm].days);
};

export const generatePDF = (data: InvoiceData, logoDataUrl?: string | null) => {
  const doc = new jsPDF();
  const { subtotal, vatAmount, total } = calculateTotals(data.products, data.vatRate);
  const currency = currencySymbols[data.currency];
  const pageWidth = doc.internal.pageSize.width;
  const dueDate = calculateDueDate(data.date, data.paymentTerm);

  // Helper function to draw horizontal line
  const drawLine = (y: number) => {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(20, y, pageWidth - 20, y);
  };

  // Header - Title (FACTUUR)
  let currentY = 30;
  doc.setFontSize(24);
  doc.setTextColor(0, 100, 0); // Dark green color for FACTUUR only
  doc.setFont("helvetica", "bold");
  const t = i18n.t;
  doc.text(t("invoice.title"), 20, currentY);
  doc.setTextColor(0, 0, 0); // Reset to black for rest of the text

  // Logo on right if provided
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'JPEG', pageWidth - 50, currentY - 20, 30, 30);
  }
  currentY += 20;

  // Company and personal details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const leftDetails = [
    data.name,
    data.companyName,
    data.address,
    `KvK: ${data.cocNumber}`,
    `BTW: ${data.vatNumber}`,
    `IBAN: ${data.iban}`,
  ];

  const rightDetails = [
    `${t("invoice.details.number")}: ${data.invoiceNumber}`,
    `${t("invoice.details.date")}: ${format(data.date, 'dd-MM-yyyy')}`,
    `${t("invoice.details.dueDate")}: ${format(dueDate, 'dd-MM-yyyy')}`,
    `${t("invoice.details.paymentTerms")}: ${paymentTerms[data.paymentTerm].label}`,
  ];

  doc.text(leftDetails, 20, currentY);
  doc.text(rightDetails, pageWidth - 90, currentY);

  currentY += 50;
  drawLine(currentY);
  currentY += 15;

  // Table headers
  const headers = [[
    t("invoice.products.description"),
    t("invoice.products.quantity"),
    t("invoice.products.price"),
    t("invoice.products.total")
  ]];

  // Table header row
  doc.setFont("helvetica", "bold");
  doc.text(t("invoice.products.description"), 20, currentY);
  doc.text(t("invoice.products.quantity"), pageWidth - 150, currentY, { align: "right" });
  doc.text(t("invoice.products.price"), pageWidth - 100, currentY, { align: "right" });
  doc.text(t("invoice.products.total"), pageWidth - 20, currentY, { align: "right" });

  doc.setFont("helvetica", "normal");
  currentY += 5;
  drawLine(currentY);
  currentY += 10;

  // Table content
  data.products.forEach((product) => {
    doc.text(product.description, 20, currentY);
    doc.text(product.quantity.toString(), pageWidth - 150, currentY, { align: "right" });
    doc.text(`${currency} ${product.price.toFixed(2)}`, pageWidth - 100, currentY, { align: "right" });
    doc.text(
      `${currency} ${(product.quantity * product.price).toFixed(2)}`,
      pageWidth - 20,
      currentY,
      { align: "right" }
    );
    currentY += 8;
  });

  currentY += 5;
  drawLine(currentY);
  currentY += 15;

  // Totals section
  const startX = pageWidth - 80;
  doc.text(`${t("invoice.vat.subtotal")}:`, startX, currentY);
  doc.text(`${currency} ${subtotal.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  currentY += 8;
  doc.text(`${t("invoice.vat.rate")} (${data.vatRate}%)`, startX, currentY);
  doc.text(`${currency} ${vatAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.text(t("invoice.vat.total"), startX, currentY);
  doc.text(`${currency} ${total.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  // Notes
  if (data.notes) {
    currentY = doc.internal.pageSize.height - 40;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${t("invoice.details.notes")}: ${data.notes}`, 20, currentY);
  }

  return doc;
};

// Helper function to convert hex/rgb color to RGB array
function hexToRgb(color: string): [number, number, number] {
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches) {
      return [parseInt(matches[0]), parseInt(matches[1]), parseInt(matches[2])];
    }
  }
  // Default to black if color parsing fails
  return [0, 0, 0];
}