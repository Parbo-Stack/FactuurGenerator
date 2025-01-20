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
    doc.setDrawColor(220, 220, 220); // Lighter gray color for lines
    doc.setLineWidth(0.1);
    doc.line(20, y, pageWidth - 20, y);
  };

  // Set font
  doc.setFont("helvetica");

  // Header - Company Name and Logo
  let currentY = 20;

  // Title
  doc.setFontSize(24);
  doc.text("FACTUUR", 20, currentY);
  currentY += 15;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'JPEG', pageWidth - 50, 20, 30, 30);
  }

  // Company details - Left side
  doc.setFontSize(10);
  doc.text([
    data.companyName,
    data.address,
    `KvK: ${data.cocNumber}`,
    `BTW: ${data.vatNumber}`,
    `IBAN: ${data.iban}`,
  ], 20, currentY);

  // Invoice details - Right side
  doc.text([
    `Factuurnummer: ${data.invoiceNumber}`,
    `Datum: ${data.date.toLocaleDateString("nl-NL")}`,
  ], pageWidth - 70, currentY);

  currentY += 30;
  drawLine(currentY);
  currentY += 15;

  // Products table header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  // Table headers
  const columns = {
    description: { x: 20, width: 60 },
    quantity: { x: 85, width: 20 },
    unit: { x: 110, width: 20 },
    price: { x: 135, width: 30 },
    vat: { x: 160, width: 20 },
    total: { x: 180, width: 30 }
  };

  doc.text("Omschrijving", columns.description.x, currentY);
  doc.text("Aantal", columns.quantity.x, currentY);
  doc.text("Eenheid", columns.unit.x, currentY);
  doc.text("Tarief", columns.price.x, currentY);
  doc.text("BTW%", columns.vat.x, currentY);
  doc.text("Totaal", columns.total.x, currentY);

  // Reset font
  doc.setFont("helvetica", "normal");

  currentY += 5;
  drawLine(currentY);
  currentY += 10;

  // Table content
  data.products.forEach((product) => {
    doc.text(product.description, columns.description.x, currentY);
    doc.text(product.quantity.toString(), columns.quantity.x, currentY);
    doc.text("Stuk", columns.unit.x, currentY);
    doc.text(`${currency} ${product.price.toFixed(2)}`, columns.price.x, currentY);
    doc.text(`${data.vatRate}%`, columns.vat.x, currentY);
    doc.text(
      `${currency} ${(product.quantity * product.price).toFixed(2)}`,
      columns.total.x,
      currentY
    );
    currentY += 8;
  });

  currentY += 5;
  drawLine(currentY);
  currentY += 15;

  // Totals section
  const totalsX = pageWidth - 80;
  doc.text("Bedrag excl. btw", totalsX, currentY);
  doc.text(`${currency} ${subtotal.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  currentY += 8;
  doc.text(`BTW ${data.vatRate}%`, totalsX, currentY);
  doc.text(`${currency} ${vatAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Totaalbedrag", totalsX, currentY);
  doc.text(`${currency} ${total.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

  // Notes section
  if (data.notes) {
    currentY += 20;
    doc.setFont("helvetica", "normal");
    doc.text("Opmerkingen:", 20, currentY);
    currentY += 8;
    doc.text(data.notes, 20, currentY);
  }

  // Payment terms
  currentY = doc.internal.pageSize.height - 20;
  doc.setFontSize(9);
  doc.text("Betaling binnen 14 dagen na factuurdatum", 20, currentY);

  return doc;
};