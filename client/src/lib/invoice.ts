import { jsPDF } from "jspdf";
import { type InvoiceTemplate } from "./invoice-templates";

export interface Product {
  description: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  companyName: string;
  address: string;
  cocNumber: string;
  vatNumber: string;
  iban: string;
  invoiceNumber: string;
  date: Date;
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

export const generatePDF = (data: InvoiceData, logoDataUrl?: string | null, template?: InvoiceTemplate) => {
  const doc = new jsPDF();
  const { subtotal, vatAmount, total } = calculateTotals(data.products, data.vatRate);
  const currency = currencySymbols[data.currency];
  const pageWidth = doc.internal.pageSize.width;

  // Helper function to draw horizontal line
  const drawLine = (y: number) => {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(20, y, pageWidth - 20, y);
  };

  // Header - Title (FACTUUR)
  let currentY = 30;
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");

  // Modern layout: center everything
  if (template?.layout === "modern") {
    doc.text("FACTUUR", pageWidth / 2, currentY, { align: "center" });
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', (pageWidth - 30) / 2, currentY + 10, 30, 30);
      currentY += 50;
    }
  } else {
    // Classic layout: left-aligned with logo on right
    doc.text("FACTUUR", 20, currentY);
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', pageWidth - 50, currentY - 20, 30, 30);
    }
    currentY += 20;
  }

  // Company details based on layout
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const companyDetails = [
    data.companyName,
    data.address,
    `KvK: ${data.cocNumber}`,
    `BTW: ${data.vatNumber}`,
    `IBAN: ${data.iban}`,
  ];

  const invoiceDetails = [
    `Factuurnummer: ${data.invoiceNumber}`,
    `Datum: ${data.date.toLocaleDateString("nl-NL")}`,
  ];

  if (template?.layout === "modern") {
    // Modern: Center-aligned details
    doc.text(companyDetails, pageWidth / 2, currentY, { align: "center" });
    currentY += 30;
    doc.text(invoiceDetails, pageWidth / 2, currentY, { align: "center" });
  } else {
    // Classic: Left-aligned details with invoice info on right
    doc.text(companyDetails, 20, currentY);
    doc.text(invoiceDetails, pageWidth - 90, currentY);
  }

  currentY += 40;
  drawLine(currentY);
  currentY += 15;

  // Table headers
  const columns = {
    description: { x: 20, align: "left" as const },
    quantity: { x: pageWidth - 150, align: "right" as const },
    price: { x: pageWidth - 100, align: "right" as const },
    total: { x: pageWidth - 20, align: "right" as const }
  };

  // Table header row
  doc.setFont("helvetica", "bold");
  doc.text("Omschrijving", columns.description.x, currentY);
  doc.text("Aantal", columns.quantity.x, currentY, { align: columns.quantity.align });
  doc.text("Prijs", columns.price.x, currentY, { align: columns.price.align });
  doc.text("Totaal", columns.total.x, currentY, { align: columns.total.align });

  doc.setFont("helvetica", "normal");
  currentY += 5;
  drawLine(currentY);
  currentY += 10;

  // Table content
  data.products.forEach((product) => {
    doc.text(product.description, columns.description.x, currentY);
    doc.text(product.quantity.toString(), columns.quantity.x, currentY, { align: columns.quantity.align });
    doc.text(`${currency} ${product.price.toFixed(2)}`, columns.price.x, currentY, { align: columns.price.align });
    doc.text(
      `${currency} ${(product.quantity * product.price).toFixed(2)}`,
      columns.total.x,
      currentY,
      { align: columns.total.align }
    );
    currentY += 8;
  });

  currentY += 5;
  drawLine(currentY);
  currentY += 15;

  // Totals section
  doc.text("Subtotaal:", pageWidth - 80, currentY);
  doc.text(`${currency} ${subtotal.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  currentY += 8;
  doc.text(`BTW ${data.vatRate}%:`, pageWidth - 80, currentY);
  doc.text(`${currency} ${vatAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Totaal:", pageWidth - 80, currentY);
  doc.text(`${currency} ${total.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  // Payment terms at bottom
  currentY = doc.internal.pageSize.height - 20;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const paymentTerms = "Betaling binnen 14 dagen na factuurdatum";
  if (template?.layout === "modern") {
    doc.text(paymentTerms, pageWidth / 2, currentY, { align: "center" });
  } else {
    doc.text(paymentTerms, 20, currentY);
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