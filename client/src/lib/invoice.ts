import { jsPDF } from "jspdf";

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

export const generatePDF = (data: InvoiceData, logoDataUrl?: string | null) => {
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

  // Set font
  doc.setFont("helvetica");

  // Header - Title (FACTUUR)
  let currentY = 30;
  doc.setFontSize(24);
  doc.setTextColor(0, 100, 0); // Dark green color
  doc.setFont("helvetica", "bold");
  doc.text("FACTUUR", 20, currentY);

  // Logo placement at the same height as FACTUUR
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'JPEG', pageWidth - 50, currentY - 20, 30, 30);
  }

  doc.setTextColor(0, 0, 0); // Reset to black
  doc.setFont("helvetica", "normal");
  currentY += 20;

  // Company details
  doc.setFontSize(10);
  const companyDetails = [
    data.companyName,
    data.address,
    `KvK: ${data.cocNumber}`,
    `BTW: ${data.vatNumber}`,
    `IBAN: ${data.iban}`,
  ];
  doc.text(companyDetails, 20, currentY);

  // Invoice details (right side)
  doc.text([
    `Factuurnummer: ${data.invoiceNumber}`,
    `Datum: ${data.date.toLocaleDateString("nl-NL")}`,
  ], pageWidth - 90, currentY);

  currentY += 40;
  drawLine(currentY);
  currentY += 15;

  // Table headers with proper spacing
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

  // Reset font and prepare for content
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
  doc.text("Betaling binnen 14 dagen na factuurdatum", 20, currentY);

  return doc;
};